import { SelectionModel } from "@angular/cdk/collections";
import { FlatTreeControl } from "@angular/cdk/tree";
import { Component, Injectable } from "@angular/core";
import {
  MatTreeFlatDataSource,
  MatTreeFlattener
} from "@angular/material/tree";
import { BehaviorSubject } from "rxjs";

/**
 * Node for to-do item
 */
export class TodoItemNode {
  children: TodoItemNode[];
  item: string;
  color: string;
  propName: string;
  path: string;
}

enum Colors {
  RED = "RED",
  GREEN = "GREEN",
  ORANGE = "ORANGE",
  BLACK = "BLACK"
}

/** Flat to-do item node with expandable and level information */
export class TodoItemFlatNode {
  item: string;
  level: number;
  color: string;
  expandable: boolean;
  propName: string;
  path: string;
}

/**
 * The Json object for to-do list data.
 */
const TREE_DATA = {
  vsgName: "test-object-complex",
  domainId: 3,
  variableBusinessGroupVersions: [
    {
      domainId: 3,
      locked: false,
      variableSetList: [
        {
          varSetName: "MerchantInfo",
          packageName: "com.company.children",
          referenceName: "merchantInfo",
          variableVersions: [
            {
              varName: "merchantName",
              dataType: "String",
              primitiveType: true
            }
          ]
        }
      ]
    }
  ]
};

/**
 * The Json object for to-do list data.
 */
const TREE_DATAV1 = {
  vsgName: "test-object-complexx",
  domainId: 3,
  variableBusinessGroupVersions: [
    {
      domainId: 3,
      locked: true,
      variableSetList: [
        {
          packageName: "com.company.children",
          referenceName: "merchantInfo",
          variableVersions: [
            {
              varName: "merchantName",
              dataType: "String",
              primitiveType: true
            }
          ]
        }
      ]
    }
  ]
};

/**
 * Checklist database, it can build a tree structured Json object.
 * Each node in Json object represents a to-do item or a category.
 * If a node is a category, it has children items and new items can be added under the category.
 */
@Injectable()
export class ChecklistDatabase {
  dataChange = new BehaviorSubject<TodoItemNode[]>([]);

  get data(): TodoItemNode[] {
    return this.dataChange.value;
  }

  constructor() {
    this.initialize();
  }

  initialize() {
    // Build the tree nodes from Json object. The result is a list of `TodoItemNode` with nested
    //     file node as children.
    const data = this.buildFileTree(TREE_DATA, 0);
    // console.log(data);

    // Notify the change.
    this.dataChange.next(data);
  }

  /**
   * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
   * The return value is the list of `TodoItemNode`.
   */
  buildFileTree(
    obj: { [key: string]: any },
    level: number,
    path: string = "/"
  ): TodoItemNode[] {
    return Object.keys(obj).reduce<TodoItemNode[]>((accumulator, key) => {
      const value = obj[key];
      const node = new TodoItemNode();
      node.item = key;
      node.path = path + key;
      node.color = Colors.BLACK;

      if (value != null) {
        if (typeof value === "object") {
          node.children = this.buildFileTree(value, level + 1, node.path + "/");
        } else {
          node.item = value;
          node.propName = key;
        }
      }

      return accumulator.concat(node);
    }, []);
  }

  /** Add an item to to-do list */
  insertItem(parent: TodoItemNode, name: string) {
    if (parent.children) {
      parent.children.push({ item: name } as TodoItemNode);
      this.dataChange.next(this.data);
    }
  }

  updateItem(node: TodoItemNode, name: string) {
    node.item = name;
    this.dataChange.next(this.data);
  }
  updateItemColor(node: TodoItemNode, color: Colors) {
    node.color = color;
    this.dataChange.next(this.data);
  }
}

/**
 * @title Tree with checkboxes
 */
@Component({
  selector: "tree",
  templateUrl: "tree.component.html",
  styleUrls: ["tree.component.css"],
  providers: [ChecklistDatabase]
})
export class TreeComponent {}
