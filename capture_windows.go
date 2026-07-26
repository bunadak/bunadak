//go:build windows

package main

// Ekran bölgesi yakalama (Web Katmanı → Çözüm Modu köprüsü).
//
// Tarayıcı güvenliği, çapraz-kaynak iframe'lerin (ör. YouTube) piksellerine
// JavaScript'ten erişime izin vermez. Bu yüzden çözüm modunda çerçevelenen
// video/sayfa görüntüsü Go tarafında, GDI ile doğrudan ekrandan alınır.
// Koordinatlar FİZİKSEL pikseldir; uygulama manifesti PerMonitorV2 DPI-aware
// olduğundan GDI ekran DC'si fiziksel piksel uzayında çalışır.

import (
	"bytes"
	"encoding/base64"
	"errors"
	"image"
	"image/png"
	"syscall"
	"unsafe"
)

var (
	capUser32              = syscall.NewLazyDLL("user32.dll")
	capGdi32               = syscall.NewLazyDLL("gdi32.dll")
	capGetDC               = capUser32.NewProc("GetDC")
	capReleaseDC           = capUser32.NewProc("ReleaseDC")
	capCreateCompatibleDC  = capGdi32.NewProc("CreateCompatibleDC")
	capCreateDIBSection    = capGdi32.NewProc("CreateDIBSection")
	capSelectObject        = capGdi32.NewProc("SelectObject")
	capBitBlt              = capGdi32.NewProc("BitBlt")
	capDeleteDC            = capGdi32.NewProc("DeleteDC")
	capDeleteObject        = capGdi32.NewProc("DeleteObject")
)

type capBitmapInfoHeader struct {
	Size          uint32
	Width         int32
	Height        int32
	Planes        uint16
	BitCount      uint16
	Compression   uint32
	SizeImage     uint32
	XPelsPerMeter int32
	YPelsPerMeter int32
	ClrUsed       uint32
	ClrImportant  uint32
}

// SRCCOPY | CAPTUREBLT — katmanlı (layered) pencere içerikleri de dahil olsun.
const capSrcCopy = 0x00CC0020 | 0x40000000

func captureScreenRegion(x, y, w, h int) (string, error) {
	if w <= 0 || h <= 0 || w > 8192 || h > 8192 {
		return "", errors.New("geçersiz yakalama bölgesi")
	}
	screen, _, _ := capGetDC.Call(0)
	if screen == 0 {
		return "", errors.New("ekran DC alınamadı")
	}
	defer capReleaseDC.Call(0, screen)

	mem, _, _ := capCreateCompatibleDC.Call(screen)
	if mem == 0 {
		return "", errors.New("bellek DC oluşturulamadı")
	}
	defer capDeleteDC.Call(mem)

	bi := capBitmapInfoHeader{Size: 40, Width: int32(w), Height: -int32(h), Planes: 1, BitCount: 32}
	var bits unsafe.Pointer
	bmp, _, _ := capCreateDIBSection.Call(mem, uintptr(unsafe.Pointer(&bi)), 0,
		uintptr(unsafe.Pointer(&bits)), 0, 0)
	if bmp == 0 || bits == nil {
		return "", errors.New("DIB oluşturulamadı")
	}
	defer capDeleteObject.Call(bmp)

	old, _, _ := capSelectObject.Call(mem, bmp)
	defer capSelectObject.Call(mem, old)

	ok, _, _ := capBitBlt.Call(mem, 0, 0, uintptr(w), uintptr(h),
		screen, uintptr(int64(x)), uintptr(int64(y)), capSrcCopy)
	if ok == 0 {
		return "", errors.New("ekran kopyalanamadı")
	}

	src := unsafe.Slice((*byte)(bits), w*h*4)
	img := image.NewNRGBA(image.Rect(0, 0, w, h))
	for i := 0; i < w*h; i++ { // BGRA → RGBA
		img.Pix[i*4+0] = src[i*4+2]
		img.Pix[i*4+1] = src[i*4+1]
		img.Pix[i*4+2] = src[i*4+0]
		img.Pix[i*4+3] = 255
	}
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		return "", err
	}
	return "data:image/png;base64," + base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}
