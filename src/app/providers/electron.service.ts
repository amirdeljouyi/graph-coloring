import { Injectable, EventEmitter } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame, remote, BrowserWindow, Menu, app, shell, dialog, MenuItemConstructorOptions, MenuItem } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { Router } from '@angular/router';

@Injectable()
export class ElectronService {

  clickImport: EventEmitter<any> = new EventEmitter();
  clickExport: EventEmitter<any> = new EventEmitter();
  clickPetersen: EventEmitter<any> = new EventEmitter();
  clickHS: EventEmitter<any> = new EventEmitter();
  clickWP: EventEmitter<any> = new EventEmitter();

  ipcRenderer: typeof ipcRenderer;
  webFrame: typeof webFrame;
  remote: typeof remote;
  childProcess: typeof childProcess;
  fs: typeof fs;

  menu: typeof Menu;
  rightClickMenu: typeof Menu;
  template = [
    {
      label: 'File',
      submenu: [
        {
          role: 'import file',
          label: 'Import File'
        },
        {
          role: 'export file',
          label: 'Export File'
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          role: 'about',
          label: 'About'
        },
        {
          role: 'github',
          label: 'Github'
        }
      ]
    }
  ] as MenuItemConstructorOptions[];

  rightClickTemplate = [
    {
      label: 'Petersen Graph',
    },
    { type: 'separator' },
    {
      label: 'Welsh Powell',
    },
    {
      label: 'Harmony Search',
    }
  ] as MenuItemConstructorOptions[];

  constructor(private router:Router) {

    // Conditional imports
    if (this.isElectron()) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;
      this.remote = window.require('electron').remote;

      this.childProcess = window.require('child_process');
      this.fs = window.require('fs');
      this.menu = this.remote.Menu;
      this.rightClickMenu = this.remote.Menu;

      this.template[0].submenu[0].click = (e) => {
        this.clickImport.emit(e);
      };

      this.template[0].submenu[1].click = (e) => {
        this.clickExport.emit(e);
      };

      this.template[4].submenu[0].click = () => {
        const options = {
          type: 'info',
          title: 'About',
          message: 'Graph Coloring by Amir Deljouyi\nThank you for using this app , please share your feedback with me\nVersion 1.0.0',
          buttons: ['ok']
        };
        this.remote.dialog.showMessageBox(options, (index) => {
        });
      };

      this.template[4].submenu[1].click = () => {
        this.remote.shell.openExternal('https://amirdeljouyi.github.io');
      };

      const menu = this.menu.buildFromTemplate(this.template);
      this.menu.setApplicationMenu(menu);
      // const rightClickMenu = new Menu;

      this.rightClickTemplate[0].click = (e) => {
        this.clickPetersen.emit(e);
      };

      this.rightClickTemplate[2].click = (e) => {
        this.clickWP.emit(e);
      };

      this.rightClickTemplate[3].click = (e) => {
        this.clickHS.emit(e);
      };

      const rightClickMenu = this.rightClickMenu.buildFromTemplate(this.rightClickTemplate);

      this.remote.ipcMain.on('show-context-menu', (event) => {
        const win = this.remote.BrowserWindow.fromWebContents(event.sender);
        rightClickMenu.popup({ window: win });
      });

    }
  }

  isElectron = () => {
    return window && window.process && window.process.type;
  }

}
