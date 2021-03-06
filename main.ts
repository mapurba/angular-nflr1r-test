import "./polyfills";

import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatNativeDateModule } from "@angular/material";
import { BrowserModule } from "@angular/platform-browser";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { DemoMaterialModule } from "./material-module";

import { TreeChecklistExample } from "./app/tree-checklist-example";
import { TreeComponent } from "./tree/tree.component";
import { PojoDisplayComponent } from "./app/pojo-display.component";
import { TreeDataService } from "./app/tree-data.service";

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    DemoMaterialModule,
    MatNativeDateModule,
    ReactiveFormsModule
  ],
  entryComponents: [TreeChecklistExample, TreeComponent, PojoDisplayComponent],
  declarations: [TreeChecklistExample, TreeComponent, PojoDisplayComponent],
  bootstrap: [TreeChecklistExample],
  providers: [TreeDataService]
})
export class AppModule {}

platformBrowserDynamic().bootstrapModule(AppModule);

/**  Copyright 2018 Google Inc. All Rights Reserved.
    Use of this source code is governed by an MIT-style license that
    can be found in the LICENSE file at http://angular.io/license */
