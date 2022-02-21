import { Component, ViewChild } from '@angular/core';
import { Platform, IonRouterOutlet } from '@ionic/angular';
import {
  BackgroundColorOptions,
  StatusBar,
  Style,
} from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  @ViewChild(IonRouterOutlet, { static: true }) routerOutlet: IonRouterOutlet;
  options: BackgroundColorOptions = { color: '#ffffff' };
  constructor(private platform: Platform) {
    this.platform.ready().then(() => {
      if (this.platform.is('cordova')) {
        StatusBar.setStyle({ style: Style.Light });
        StatusBar.setBackgroundColor(this.options);
        this.appExit();
      }
    });
  }

  appExit() {
    this.platform.backButton.subscribeWithPriority(-1, () => {
      if (!this.routerOutlet.canGoBack()) {
        navigator['app'].exitApp();
      }
    });
  }
}
