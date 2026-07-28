//go:build !windows

package main

import (
	"encoding/base64"
	"errors"
	"os"
	"path/filepath"
	"strings"
)

// Windows dışında yalnız PDF geçişi desteklenir (dönüştürücü Office/LibreOffice
// bağımlıdır); frontend bu durumda kullanıcıyı PDF yüklemeye yönlendirir.
func convertSlidesToPDF(path string) (string, error) {
	if strings.EqualFold(filepath.Ext(path), ".pdf") {
		b, err := os.ReadFile(path)
		if err != nil {
			return "", err
		}
		return "data:application/pdf;base64," + base64.StdEncoding.EncodeToString(b), nil
	}
	return "", errors.New("slayt dönüştürme yalnız Windows'ta desteklenir")
}
