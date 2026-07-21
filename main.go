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
		Title:            "Notis Pro",
		Width:            1440,
		Height:           900,
		MinWidth:         1024,
		MinHeight:        640,
		AssetServer:      &assetserver.Options{Assets: assets},
		BackgroundColour: &options.RGBA{R: 15, G: 18, B: 22, A: 1},
		OnStartup:        app.startup,
		Bind:             []interface{}{app},
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
