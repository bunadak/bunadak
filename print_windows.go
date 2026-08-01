//go:build windows

package main

// Yazdırma ve dosya açma köprüsü.
//
// Uygulamada hiçbir yazdırma yolu yoktu (denetim maddesi 75): ders notunu
// yazdırmak isteyen öğrenci hiçbir şey yapamıyordu. Tuval tabanlı bu düzende
// tarayıcının window.print() işlevi işe yaramaz. Bu yüzden yazdırma iki adımda
// yapılır: ön yüz sayfaları gerçek kâğıt ölçüsünde bir PDF'e basar, burada
// geçici bir dosyaya yazılır ve Windows'un kendi yazdırma zinciri çalıştırılır.

import (
	"encoding/base64"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"syscall"
	"time"
	"unsafe"
)

var (
	shell32      = syscall.NewLazyDLL("shell32.dll")
	shellExecute = shell32.NewProc("ShellExecuteW")
)

// shellRun, verb ("print" / "open") ile bir dosyayı Windows kabuğuna devreder.
// Dönüş değeri 32'den büyükse işlem başarılıdır (ShellExecute sözleşmesi).
func shellRun(verb, path string) error {
	v, err := syscall.UTF16PtrFromString(verb)
	if err != nil {
		return err
	}
	p, err := syscall.UTF16PtrFromString(path)
	if err != nil {
		return err
	}
	r, _, _ := shellExecute.Call(0, uintptr(unsafe.Pointer(v)), uintptr(unsafe.Pointer(p)), 0, 0, 1)
	if r <= 32 {
		return errors.New("Windows dosyayı açamadı (kod " + itoa(int(r)) + ")")
	}
	return nil
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	neg := n < 0
	if neg {
		n = -n
	}
	var b [20]byte
	i := len(b)
	for n > 0 {
		i--
		b[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		b[i] = '-'
	}
	return string(b[i:])
}

// writeTemp, data: URL veya çıplak base64 içeriği geçici bir dosyaya yazar.
func writeTemp(name, data string) (string, error) {
	if i := strings.Index(data, ","); i >= 0 && strings.HasPrefix(data, "data:") {
		data = data[i+1:]
	}
	raw, err := base64.StdEncoding.DecodeString(data)
	if err != nil {
		return "", err
	}
	dir := filepath.Join(os.TempDir(), "NotisPro")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	safe := strings.Map(func(r rune) rune {
		if strings.ContainsRune(`\/:*?"<>|`, r) {
			return '_'
		}
		return r
	}, name)
	p := filepath.Join(dir, safe)
	if err := os.WriteFile(p, raw, 0o644); err != nil {
		return "", err
	}
	return p, nil
}

func printData(name, data string) (string, error) {
	p, err := writeTemp(name, data)
	if err != nil {
		return "", err
	}
	if err := shellRun("print", p); err != nil {
		// Bazı PDF görüntüleyicilerde "print" fiili kayıtlı değildir; o zaman
		// dosyayı aç — kullanıcı kendi uygulamasından yazdırır.
		if e2 := shellRun("open", p); e2 != nil {
			return "", err
		}
	}
	// geçici dosya yazdırma kuyruğuna alınana kadar dursun
	go func() { time.Sleep(90 * time.Second); _ = os.Remove(p) }()
	return p, nil
}

func revealPath(path string) error {
	if path == "" {
		return errors.New("yol boş")
	}
	return shellRun("open", filepath.Dir(path))
}
