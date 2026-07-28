//go:build windows

package main

// Slayt dosyası (PPTX/PPT/ODP) → PDF dönüştürücü.
//
// Tarayıcı motoru PowerPoint dosyalarını doğrudan işleyemez; bu yüzden dönüşüm
// Windows tarafında yapılır ve sonuç, uygulamanın kanıtlanmış yüksek çözünürlüklü
// PDF içe aktarma hattına verilir (slaytlar birebir, kayıpsız görünür).
//
// Sırayla denenir:
//  1. PowerPoint COM (Office kuruluysa — en yüksek sadakat, animasyon/font birebir)
//  2. LibreOffice / soffice (kuruluysa — Office olmayan makineler için)

import (
	"encoding/base64"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
)

// hidden çalıştırır — dönüşüm sırasında konsol penceresi parlamasın.
func runHidden(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	return cmd.Run()
}

func soffice() string {
	if p, err := exec.LookPath("soffice.exe"); err == nil {
		return p
	}
	for _, base := range []string{os.Getenv("ProgramFiles"), os.Getenv("ProgramFiles(x86)")} {
		if base == "" {
			continue
		}
		p := filepath.Join(base, "LibreOffice", "program", "soffice.exe")
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return ""
}

// convertSlidesToPDF returns the converted PDF as a base64 data URL.
func convertSlidesToPDF(path string) (string, error) {
	if path == "" {
		return "", errors.New("dosya yolu boş")
	}
	if _, err := os.Stat(path); err != nil {
		return "", errors.New("dosya bulunamadı")
	}
	if strings.EqualFold(filepath.Ext(path), ".pdf") {
		b, err := os.ReadFile(path)
		if err != nil {
			return "", err
		}
		return "data:application/pdf;base64," + base64.StdEncoding.EncodeToString(b), nil
	}

	tmp, err := os.MkdirTemp("", "notis-slides-")
	if err != nil {
		return "", err
	}
	defer os.RemoveAll(tmp)
	out := filepath.Join(tmp, "slides.pdf")

	// 1) PowerPoint COM — en yüksek sadakat
	ps := `$ErrorActionPreference='Stop'
$app = New-Object -ComObject PowerPoint.Application
try {
  $pres = $app.Presentations.Open("` + path + `", $true, $false, $false)
  $pres.SaveAs("` + out + `", 32)
  $pres.Close()
} finally { $app.Quit() }`
	_ = runHidden("powershell", "-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", ps)
	if b, err := os.ReadFile(out); err == nil && len(b) > 1024 {
		return "data:application/pdf;base64," + base64.StdEncoding.EncodeToString(b), nil
	}

	// 2) LibreOffice
	if so := soffice(); so != "" {
		_ = runHidden(so, "--headless", "--norestore", "--convert-to", "pdf", "--outdir", tmp, path)
		guess := filepath.Join(tmp, strings.TrimSuffix(filepath.Base(path), filepath.Ext(path))+".pdf")
		if b, err := os.ReadFile(guess); err == nil && len(b) > 1024 {
			return "data:application/pdf;base64," + base64.StdEncoding.EncodeToString(b), nil
		}
	}

	return "", errors.New("Slayt dönüştürülemedi. Bilgisayarda Microsoft PowerPoint veya LibreOffice kurulu olmalı — ya da sunuyu PDF olarak kaydedip yükleyebilirsin.")
}
