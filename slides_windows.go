//go:build windows

package main

// Belge → PDF dönüştürücü (Slayt Sunusu + Genel İçe Aktarma).
//
// Tarayıcı motoru Office belgelerini doğrudan işleyemez; bu yüzden dönüşüm
// Windows tarafında yapılır ve sonuç, uygulamanın kanıtlanmış yüksek
// çözünürlüklü PDF hattına verilir (belge birebir, kayıpsız görünür).
//
// Sırayla denenir:
//  1. Office COM (PowerPoint / Word / Excel kuruluysa — en yüksek sadakat)
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

func pdfDataURL(b []byte) string {
	return "data:application/pdf;base64," + base64.StdEncoding.EncodeToString(b)
}

// powershell betiğini gizli çalıştırır.
func runPS(script string) {
	_ = runHidden("powershell", "-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", script)
}

// officeScript belge türüne uygun COM betiğini üretir ("" = uygun COM yok).
func officeScript(ext, in, out string) string {
	switch ext {
	case ".pptx", ".ppt", ".pptm", ".odp", ".pps", ".ppsx":
		return `$ErrorActionPreference='Stop'
$app = New-Object -ComObject PowerPoint.Application
try {
  $pres = $app.Presentations.Open("` + in + `", $true, $false, $false)
  $pres.SaveAs("` + out + `", 32)
  $pres.Close()
} finally { $app.Quit() }`
	case ".docx", ".doc", ".docm", ".odt", ".rtf", ".txt":
		return `$ErrorActionPreference='Stop'
$app = New-Object -ComObject Word.Application
$app.Visible = $false
try {
  $doc = $app.Documents.Open("` + in + `", $false, $true)
  $doc.SaveAs([ref]"` + out + `", [ref]17)
  $doc.Close([ref]$false)
} finally { $app.Quit() }`
	case ".xlsx", ".xls", ".xlsm", ".ods", ".csv":
		return `$ErrorActionPreference='Stop'
$app = New-Object -ComObject Excel.Application
$app.Visible = $false
$app.DisplayAlerts = $false
try {
  $wb = $app.Workbooks.Open("` + in + `")
  $wb.ExportAsFixedFormat(0, "` + out + `")
  $wb.Close($false)
} finally { $app.Quit() }`
	}
	return ""
}

// convertToPDF, desteklenen her belgeyi PDF'e çevirip data URL döndürür.
// PDF girdileri olduğu gibi geçer.
func convertToPDF(path string) (string, error) {
	if path == "" {
		return "", errors.New("dosya yolu boş")
	}
	if _, err := os.Stat(path); err != nil {
		return "", errors.New("dosya bulunamadı")
	}
	ext := strings.ToLower(filepath.Ext(path))
	if ext == ".pdf" {
		b, err := os.ReadFile(path)
		if err != nil {
			return "", err
		}
		return pdfDataURL(b), nil
	}

	tmp, err := os.MkdirTemp("", "notis-conv-")
	if err != nil {
		return "", err
	}
	defer os.RemoveAll(tmp)
	out := filepath.Join(tmp, "belge.pdf")

	// 1) Office COM — en yüksek sadakat
	if s := officeScript(ext, path, out); s != "" {
		runPS(s)
		if b, err := os.ReadFile(out); err == nil && len(b) > 1024 {
			return pdfDataURL(b), nil
		}
	}

	// 2) LibreOffice — her türü çevirir
	if so := soffice(); so != "" {
		_ = runHidden(so, "--headless", "--norestore", "--convert-to", "pdf", "--outdir", tmp, path)
		guess := filepath.Join(tmp, strings.TrimSuffix(filepath.Base(path), filepath.Ext(path))+".pdf")
		if b, err := os.ReadFile(guess); err == nil && len(b) > 1024 {
			return pdfDataURL(b), nil
		}
	}

	return "", errors.New("Bu dosya PDF'e çevrilemedi (" + ext + "). PowerPoint/Word/Excel ya da LibreOffice kurulu olmalı — " +
		"alternatif olarak belgeyi PDF kaydedip yükleyebilirsin.")
}

// convertSlidesToPDF geriye dönük ad — slayt akışı bunu çağırır.
func convertSlidesToPDF(path string) (string, error) { return convertToPDF(path) }
