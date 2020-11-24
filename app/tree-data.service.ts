import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

/**
 * Checklist database, it can build a tree structured Json object.
 * Each node in Json object represents a to-do item or a category.
 * If a node is a category, it has properties items and new items can be added under the category.
 */
const TREE_DATA = {
  id: "1",
  color: "black",
  properties: [
    {
      id: "merchantName",
      color: "black",
      varName: "merchantName",
      dataType: "String",
      primitiveType: true
    },
    {
      id: "b",
      color: "black",
      properties: [
        {
          id: "merchantinfo",
          color: "black",
          varName: "merchantName",
          dataType: "String",
          primitiveType: true
        }
      ]
    }
  ]
};

export class TreeNode {
  id: string;
  value: any;
  color: string;
  properties: [];
  path: string;
}

export class TreePropsNode {
  id: string;
  dataType: string;
  value: any;
  color: string;
  path: string;

  // id: "merchantinfo",
  // color: "black",
  // varName: "merchantName",
  // dataType: "String",
  // primitiveType: true
}

@Injectable()
export class TreeDataService {
  dataChange = new BehaviorSubject<TreeNode[]>([]);

  // get data(): TodoItemNode[] {
  //   return this.dataChange.value;
  // }

  constructor() {
    this.initialize();
  }

  initialize() {
    // Build the tree nodes from Json object. The result is a list of `TodoItemNode` with nested
    //     file node as properties.
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
  ): TreeNode[] {
    return Object.keys(obj).reduce<TreeNode[]>((accumulator, key) => {
      const value = obj[key];
      const node = new TreeNode();
      node.id = key;
      node.path = path + key;
      // node.color = Colors.BLACK;

      if (value != null) {
        if (typeof value === "object") {
          node.properties = this.buildFileTree(
            value,
            level + 1,
            node.path + "/"
          );
        } else {
          node.value = value;
          // node.propName = key;
        }
      }

      return accumulator.concat(node);
    }, []);
  }

  // /** Add an item to to-do list */
  // insertItem(parent: TodoItemNode, name: string) {
  //   if (parent.properties) {
  //     parent.properties.push({ item: name } as TodoItemNode);
  //     this.dataChange.next(this.data);
  //   }
  // }

  // updateItem(node: TodoItemNode, name: string) {
  //   node.item = name;
  //   this.dataChange.next(this.data);
  // }
  // updateItemColor(node: TodoItemNode, color: Colors) {
  //   node.color = color;
  //   this.dataChange.next(this.data);
  // }
}
