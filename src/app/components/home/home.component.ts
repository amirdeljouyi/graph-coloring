import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { VisNetworkService } from 'ngx-vis';
import { GraphService } from '../../graph.service';
import { Observable, Subscription } from 'rxjs';
import { Result } from '../../models/results';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {

  data;
  result$: Result;
  results$: Result[];
  visNetwork = 'visNetwork';
  graphSubscription: Subscription;
  container: HTMLElement;
  lastNetworkClickEvent: Event = null;

  constructor(
    public graphService: GraphService,
    public visNetworkService: VisNetworkService,
  ) {
    this.results$ = new Array<Result>();
  }

  ngOnInit() {
    this.createNetwork();
    this.graphService.changeData.subscribe(data => {
      this.data = data;
      this.visNetworkService.setData(this.visNetwork, this.data);
    });
    this.graphSubscription = this.graphService.getResult().subscribe((result: Result) => {
      this.results$.push(result);
      this.result$ = result;
    });
    this.visNetworkService.doubleClick.subscribe((event) => {
      event = event[1];
      if ('nodes' in event && event.nodes.length === 1) {
        this.visNetworkService.enableEditMode(this.visNetwork);
      }
    });
    this.visNetworkService.dragEnd.subscribe((event) => {
      this.graphService.setLocations(this.visNetworkService.getPositions(this.visNetwork, undefined));
    });
    this.visNetworkService.click.subscribe((event) => {
      this.lastNetworkClickEvent = event[1];
    });
  }

  ngOnDestroy() {
    this.visNetworkService.destroy(this.visNetwork);
    this.graphSubscription.unsubscribe();
  }

  private createNetwork(): void {
    const options = {
      interaction: { hover: true },
      manipulation: {
        enabled: true,
        addNode: (data, callback) => {
          const s = this.graphService.getVertices();
          const graph = this.graphService.addNode(data, String(s));
          this.visNetworkService.setData(this.visNetwork, graph);
        },
        addEdge: (data, callback) => {
          if (typeof callback === 'function') {
            callback(null);
          }
          const graph = this.graphService.addEdge(data.from, data.to);
          this.visNetworkService.setData(this.visNetwork, graph);
        },
        editEdge: (data, callback) => {
          callback(null);
          options.manipulation.deleteEdge({ edges: [data.id] }, null);
          options.manipulation.addEdge(data, null);
        },
        deleteEdge: (data, callback) => {
          if (typeof callback === 'function') {
            callback(null);
          }
          data.edges.forEach((v: any) => {
            const ids = this.visNetworkService.getConnectedNodes(this.visNetwork, v) as any;
            const graph = this.graphService.deleteEdge(ids[0], ids[1]);
            this.visNetworkService.setData(this.visNetwork, graph);
          });
        },
        deleteNode: (data, callback) => {
          callback(null);
          data.nodes.forEach((v: string) => {
            const graph = this.graphService.deleteNode(v);
            this.visNetworkService.setData(this.visNetwork, graph);
          });
        }
      }
    };
    this.container = document.getElementById('mynetwork');
    const data = this.graphService.getGraphAsDataSet();
    this.visNetworkService.create(this.visNetwork, this.container, data, options);
    this.visNetworkService.setOptions(this.visNetwork, { nodes: { physics: this.graphService.physics as boolean } });
    this.addNetworkListeners();
  }

  addNetworkListeners = () => {
    this.visNetworkService.on(this.visNetwork, 'doubleClick');
    this.visNetworkService.on(this.visNetwork, 'dragEnd');
    this.visNetworkService.on(this.visNetwork, 'click');

    document.addEventListener('keyup', (key) => {
      if (key.key === 'Delete' && this.lastNetworkClickEvent !== null) {
        if (this.container.contains((this.lastNetworkClickEvent as any).event.target)) {
          if (('edges' in this.lastNetworkClickEvent && (this.lastNetworkClickEvent as any).edges.length === 1)
            || ('nodes' in this.lastNetworkClickEvent && (this.lastNetworkClickEvent as any).nodes.length === 1)) {
            this.visNetworkService.deleteSelected(this.visNetwork);
          }
        }
      }
    });
    document.addEventListener('click', (e) => {
      if (this.container !== e.target && !this.container.contains(e.target as Node)) {
        this.lastNetworkClickEvent = null;
      }
    });
  }

  ngAfterViewInit() {
    const emode = document.querySelector('.vis-edit-mode');
    emode.parentNode.removeChild(emode);
    const manipulation = document.querySelector('.vis-manipulation');
    manipulation.parentNode.removeChild(manipulation);
    const close = document.querySelector('.vis-close');
    close.parentNode.removeChild(close);
    const visToolbar = document.querySelector('.vis-toolbar');
    visToolbar.appendChild(emode);
    visToolbar.appendChild(manipulation);
    visToolbar.appendChild(close);
  }

}

