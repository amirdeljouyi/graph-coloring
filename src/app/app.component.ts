import { Component, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { ElectronService } from './providers/electron.service';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  isCollapsed = false;
  triggerTemplate = null;
  width = 280;
  @ViewChild('trigger') customTrigger: TemplateRef<void>;

  changeTrigger(): void {
    this.triggerTemplate = this.customTrigger;
  }
  constructor(public electronService: ElectronService,
    private translate: TranslateService) {

    translate.setDefaultLang('en');
    console.log('AppConfig', AppConfig);

    if (electronService.isElectron()) {
      console.log('Mode electron');
      console.log('Electron ipcRenderer', electronService.ipcRenderer);
      console.log('NodeJS childProcess', electronService.childProcess);
    } else {
      console.log('Mode web');
    }
  }
  ngAfterViewInit() {
    document.querySelector('#content-container').addEventListener('contextmenu', () => {
      this.electronService.ipcRenderer.send('show-context-menu');
    });
  }
  github() {
    this.electronService.remote.shell.openExternal('https://github.com/amirdeljouyi/graph-coloring');
  }
}
