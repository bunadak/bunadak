package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

// The entire pro frontend (index.html + ink.js + app.js + app.css) is embedded
// directly into the binary, exactly like the original Notis packaged its webview
// assets. No Node build step is required — the frontend is dependency-free.
//
//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/windows/icon.ico
var icon []byte

func main() {
	app := NewApp()

	err := wails.Run(&options.App{
		Title:    "Notis Pro",
		Width:    1440,
		Height:   900,
		MinWidth: 1024,
		// 1366x768 ekran + Windows %125 ölçek = 1092x614 CSS piksel.
		// Eski 640 alt sınırı bu çok yaygın laptop yapılandırmasında pencerenin
		// ekrana sığmamasına, alt kısmın görev çubuğunun altında kalmasına yol
		// açıyordu.
		MinHeight:        520,
		AssetServer:      &assetserver.Options{Assets: assets},
		BackgroundColour: &options.RGBA{R: 15, G: 18, B: 22, A: 1},
		OnStartup:        app.startup,
		// KAPANIŞTA KAYIT GARANTİSİ
		// Kayıt yalnız JS'teki beforeunload/pagehide'a bağlıydı; WebView2 native
		// pencere kapanışında bunların çalışacağı garanti değil ve saveNow()
		// asenkron olduğu için tamamlanmadan süreç ölebiliyordu. Son birkaç
		// dakikalık çalışma sessizce gidiyordu. Artık ön yüze "flush" olayı
		// gönderilip tamamlandı yanıtı beklenir (en çok 2.5 sn).
		OnBeforeClose: app.beforeClose,
		// TEK ÖRNEK KİLİDİ
		// Kilit yoktu: kullanıcı ikonu iki kez tıklarsa iki pencere açılıyor ve
		// ikisi de aynı IndexedDB'ye 1.2 saniyede bir yazıyordu. Son kapatılan,
		// diğerinin çalışmasını eziyordu — sessiz veri kaybının en sinsi türü.
		SingleInstanceLock: &options.SingleInstanceLock{
			UniqueId:               "notis-pro-single-instance",
			OnSecondInstanceLaunch: app.onSecondInstance,
		},
		Bind: []interface{}{app},
		Windows: &windows.Options{
			WebviewIsTransparent:              false,
			WindowIsTranslucent:               false,
			DisableWindowIcon:                 false,
			WebviewUserDataPath:               "",
			WebviewBrowserPath:                "",
			DisableFramelessWindowDecorations: false,
		},
	})
	if err != nil {
		println("Notis Pro başlatılamadı:", err.Error())
	}
}
