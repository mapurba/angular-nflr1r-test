import {Component, Input, OnInit, SimpleChanges} from '@angular/core';
import {Broadcaster} from "../../../../shared-service/broadcaster-service/broadcaster-service";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-pojo-display',
  templateUrl: './pojo-display.component.html',
  styleUrls: ['./pojo-display.component.scss']
})
export class PojoDisplayComponent implements OnInit {

  public field;
  @Input() public details;
  @Input() public path;
  @Input() public enableSelection;
  @Input() public nested;

  public expand = false;
  public hasFields;

  public expandAllSubscription: Subscription;
  public selectionSubscriber: Subscription;


  constructor(public broadcaster: Broadcaster) { }

  ngOnDestroy() {
    this.expandAllSubscription.unsubscribe();
    if(this.selectionSubscriber && !this.selectionSubscriber.closed)
      this.selectionSubscriber.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.details && changes.details.currentValue !== changes.details.previousValue){
      this.field = this.details.id ? this.details.id : this.details.type;
      this.hasFields = this.details.properties && this.details.properties.length > 0;
    }
  }

  ngOnInit() {
    this.field = this.details.id ? this.details.id : this.details.type;
    this.hasFields = this.details.properties && this.details.properties.length > 0;
    this.expandAllSubscription = this.broadcaster.on<string>(this.path)
      .subscribe(message => {
        this.expandAll();
      });
    //subscribe to some event (should fire on any select)
    if (!this.nested) {
      this.selectionSubscriber = this.broadcaster.on<string>('fieldSelection')
        .subscribe(message => {
          setTimeout(() => {
            this.checkSelections(this.details);
          }, 0);
        });
    }
  }
  /**
 * Ensure that all paths to selected children are selected
 * @param parent
 */
  checkSelections(parent) {
    let selectParent = false;
    for (let child of parent.properties) {
      if (child.properties)
        this.checkSelections(child);
      if (child.selected)
        selectParent = true;
    }
    parent.selected = selectParent;
  }
  

  getPackageName(){
    
    if(this.hasFields){
      
      return this.details.packageName;
    }
    
    return "";
  }
  /**
   * Get data type for the current object
   */
  getType() {
    return this.details.type;
  }


  /**
   * Get all sub property names for the current object
   */
  getSubProperties(){
    return this.details.properties;
  }
  expandAll(){
    this.expand = true;
    setTimeout(() => {
      ($('#' + this.path + this.field) as any).collapse("show");
      this.broadcaster.broadcast(this.path + this.field,true);
    });
  }

  /**
   * Check box toggled, set current node and all children nodes to selected value
   * @param $event
   */
  fieldSelected($event){
    this.details.selected = $event.target.checked;
    if(this.details.properties)
      this.setChildren(this.details,this.details.selected);
    this.broadcaster.broadcast('fieldSelection',true);
  }
  /**
   * Set children (and nested children) to selected value
   * @param parent
   * @param selected
   */
  setChildren(parent,selected){
    for(let child of parent.properties){
      child.selected = selected;
      if(child.properties)
        this.setChildren(child,selected);
    }
  }

}
