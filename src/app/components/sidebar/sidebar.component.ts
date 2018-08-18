import { Component, OnInit, Input } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { GraphService } from '../../graph.service';
import { ElectronService } from '../../providers/electron.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

  currentUrl: string;
  visible = false;
  uploadVisible = false;
  exportVisible = false;
  inputValue: number;
  maxValue: number;
  @Input() isCollapsed;
  drawer: Drawer;
  titleDrawer: string;
  lableInputDrawer: string;
  loading = false;
  file: File;


  constructor(
    private router: Router,
    private graphService: GraphService,
    private electronService: ElectronService
  ) {
    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentUrl = event.url;
      }
    });
  }

  ngOnInit() {
    this.electronService.clickImport.subscribe((e) => {
      this.importButton();
    });

    this.electronService.clickExport.subscribe((e) => {
      this.exportButton();
    });

    this.electronService.clickPetersen.subscribe((e) => {
      this.loadPetersen();
    });

    this.electronService.clickWP.subscribe((e) => {
      this.welshPowell();
    });

    this.electronService.clickHS.subscribe((e) => {
      this.harmonySearch();
    });
  }

  loadPetersen() {
    this.graphService.setPetersen();
  }
  loadKonigsberg() {
    this.graphService.setKonigsberg();
  }
  loadComplete() {
    this.drawer = 0;
    this.titleDrawer = 'Complete Graph';
    this.lableInputDrawer = 'Number of Vertices';
    this.maxValue = 13;
    this.visible = true;
  }
  loadHypercube() {
    this.drawer = 1;
    this.titleDrawer = 'Hypercube Graph';
    this.lableInputDrawer = 'Number of Vertices';
    this.maxValue = 7;
    this.visible = true;
  }
  loadCustom() {
    this.drawer = 2;
    this.titleDrawer = 'Custom Graph';
    this.lableInputDrawer = 'Number of Vertices';
    this.maxValue = 1000;
    this.visible = true;
  }

  welshPowell() {
    this.graphService.welshPowell();
  }
  harmonySearch() {
    this.graphService.harmonySearch();
  }
  genetic() {
    this.graphService.genetic();
  }

  submit() {
    switch (this.drawer) {
      case 0:
        this.graphService.setComplete(this.inputValue);
        break;
      case 1:
        this.graphService.setHypercube(this.inputValue);
        break;
      case 2:
        this.graphService.setCustom(this.inputValue);
        break;
    }
    this.visible = false;
  }

  close(): void {
    this.visible = false;
    this.uploadVisible = false;
    this.exportVisible = false;
  }

  importButton() {
    this.uploadVisible = true;
    this.titleDrawer = 'Import a File';
  }

  import() {
    if (this.file) {
      const type = this.graphService.getFileExtension(this.file.name);
      console.log(`this.files : ${this.file.name}`);
      const reader = new FileReader();
      const gs = this.graphService;
      reader.onload = (event: any) => {
        this.graphService.importFile(event.target.result, type);
      };
      reader.readAsText(this.file);
      this.uploadVisible = false;
    }
  }

  exportButton() {
    this.exportVisible = true;
    this.titleDrawer = 'Export a File';
  }

  export(format: string) {
    this.graphService.exportFile(format);
    this.exportVisible = false;
  }

  beforeUpload = (file: File) => {
    const type = this.graphService.getFileExtension(file.name);
    if (type === 'col' || type === 'json' || type === 'dimacs') {
      this.file = file;
      return true;
    }
    return false;
  }

  handleChange(file: File): void {
    this.loading = true;
    this.import();
    this.loading = false;
  }

}

enum Drawer {
  complete,
  hypercube,
  custom
}
