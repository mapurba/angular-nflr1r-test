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
  selector: "tree-checklist-example",
  templateUrl: "tree-checklist-example.html",
  styleUrls: ["tree-checklist-example.css"],
  providers: [ChecklistDatabase]
})
export class TreeChecklistExample {
  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeMap = new Map<TodoItemFlatNode, TodoItemNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<TodoItemNode, TodoItemFlatNode>();

  /** A selected parent node to be inserted */
  selectedParent: TodoItemFlatNode | null = null;

  /** The new item's name */
  newItemName = "";

  treeControl: FlatTreeControl<TodoItemFlatNode>;

  treeFlattener: MatTreeFlattener<TodoItemNode, TodoItemFlatNode>;

  dataSource: MatTreeFlatDataSource<TodoItemNode, TodoItemFlatNode>;

  toStrings(obj) {
    return JSON.stringify(obj);
  }
  /** The selection for checklist */
  checklistSelection = new SelectionModel<TodoItemFlatNode>(
    true /* multiple */
  );

  dataTree: any;

  /// diff code
  LEFT = "left";
  RIGHT = "right";
  EQUALITY = "eq";
  TYPE = "type";
  MISSING = "missing";
  diffs = [];
  requestCount = 0;

  diffString = "";
  // data1="";
  constructor(private database: ChecklistDatabase) {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this.getLevel,
      this.isExpandable,
      this.getChildren
    );
    this.treeControl = new FlatTreeControl<TodoItemFlatNode>(
      this.getLevel,
      this.isExpandable
    );
    this.dataSource = new MatTreeFlatDataSource(
      this.treeControl,
      this.treeFlattener
    );

    database.dataChange.subscribe(data => {
      this.dataSource.data = data;
      console.log(this.dataSource.data);
    });

    //to code amx

    this.dataTree = TREE_DATA;

    let left = this.dataTree;
    let right = TREE_DATAV1;
    let config = this.createConfig();

    this.formatAndDecorate(config, left);
    let config2 = this.createConfig();
    this.formatAndDecorate(config2, right);

    config.currentPath = [];
    config2.currentPath = [];

    this.diffVal(left, config, right, config2);
    this.diffColor(this.diffs);
    console.log(this.diffs);
  }

  getLevel = (node: TodoItemFlatNode) => node.level;

  isExpandable = (node: TodoItemFlatNode) => node.expandable;

  getChildren = (node: TodoItemNode): TodoItemNode[] => node.children;

  getColor = (node: TodoItemNode) => node.color;

  getPropName = (node: TodoItemNode) => node.propName;

  hasChild = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.expandable;

  hasNoContent = (_: number, _nodeData: TodoItemFlatNode) =>
    _nodeData.item === "";

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: TodoItemNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode =
      existingNode && existingNode.item === node.item
        ? existingNode
        : new TodoItemFlatNode();
    flatNode.item = node.item;
    flatNode.color = node.color;
    flatNode.propName = node.propName;
    flatNode.level = level;
    flatNode.expandable = !!node.children;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  };

  /** Whether all the descendants of the node are selected. */
  descendantsAllSelected(node: TodoItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.every(child =>
      this.checklistSelection.isSelected(child)
    );
    return descAllSelected;
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(node: TodoItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some(child =>
      this.checklistSelection.isSelected(child)
    );
    return result && !this.descendantsAllSelected(node);
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  todoItemSelectionToggle(node: TodoItemFlatNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);

    // Force update for the parent
    descendants.every(child => this.checklistSelection.isSelected(child));
    this.checkAllParentsSelection(node);
  }

  /** Toggle a leaf to-do item selection. Check all the parents to see if they changed */
  todoLeafItemSelectionToggle(node: TodoItemFlatNode): void {
    this.checklistSelection.toggle(node);
    this.checkAllParentsSelection(node);
  }

  /* Checks all the parents when a leaf node is selected/unselected */
  checkAllParentsSelection(node: TodoItemFlatNode): void {
    let parent: TodoItemFlatNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /** Check root node checked state and change it accordingly */
  checkRootNodeSelection(node: TodoItemFlatNode): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.every(child =>
      this.checklistSelection.isSelected(child)
    );
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }

  /* Get the parent node of a node */
  getParentNode(node: TodoItemFlatNode): TodoItemFlatNode | null {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }

  /** Select the category so we can insert the new item. */
  addNewItem(node: TodoItemFlatNode) {
    const parentNode = this.flatNodeMap.get(node);
    this.database.insertItem(parentNode!, "");
    this.treeControl.expand(node);
  }

  /** Save the node to database */
  saveNode(node: TodoItemFlatNode, itemValue: string) {
    const nestedNode = this.flatNodeMap.get(node);
    this.database.updateItem(nestedNode!, itemValue);
  }

  newLine(config) {
    config.line++;
    return "\n";
  }

  createConfig() {
    return {
      out: "",
      indent: -1,
      currentPath: [],
      paths: [],
      line: 1
    };
  }

  formatAndDecorate(config, data) {
    if (this.getType(data) === "array") {
      this.formatAndDecorateArray(config, data);
      return;
    }
    this.startObject(config);
    config.currentPath.push("/");
    let props = this.getSortedProperties(data);
    props.forEach(key => {
      config.out +=
        this.newLine(config) +
        this.getTabs(config.indent) +
        '"' +
        this.unescapeString(key) +
        '": ';
      config.currentPath.push(key);
      config.paths.push({
        path: this.generatePath(config),
        line: config.line
      });
      this.formatVal(data[key], config);
      config.currentPath.pop();
    });
    this.finishObject(config);
    config.currentPath.pop();
  }

  getSortedProperties(obj) {
    let props = [];
    for (let prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        props.push(prop);
      }
    }
    props = props.sort(function(a, b) {
      return a.localeCompare(b);
    });
    return props;
  }

  startObject(config) {
    config.indent++;
    config.out += "{";
    if (config.paths.length === 0) {
      config.paths.push({
        path: this.generatePath(config),
        line: config.line
      });
    }
    if (config.indent === 0) {
      config.indent++;
    }
  }

  finishObject(config) {
    if (config.indent === 0) {
      config.indent--;
    }

    this.removeTrailingComma(config);

    config.indent--;
    config.out += this.newLine(config) + this.getTabs(config.indent) + "}";
    if (config.indent !== 0) {
      config.out += ",";
    } else {
      config.out += this.newLine(config);
    }
  }

  getTabs(indent) {
    let s = "";
    for (let i = 0; i < indent; i++) {
      s += "    ";
    }
    return s;
  }

  unescapeString(val) {
    if (val) {
      return val
        .replace("\\", "\\\\")
        .replace(/\"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace("\b", "\\b")
        .replace(/\f/g, "\\f")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
    } else {
      return val;
    }
  }

  generatePath(config, prop = "") {
    let s = "";
    config.currentPath.forEach(path => {
      s += path;
    });

    if (prop) {
      s += "/" + prop;
    }

    if (s.length === 0) {
      return "/";
    } else {
      return s;
    }
  }

  formatVal(val, config) {
    if (this.getType(val) === "array") {
      config.out += "[";
      config.indent++;
      val.forEach((arrayVal, index) => {
        config.out += this.newLine(config) + this.getTabs(config.indent);
        config.paths.push({
          path: this.generatePath(config, "[" + index + "]"),
          line: config.line
        });
        config.currentPath.push("/[" + index + "]");
        this.formatVal(arrayVal, config);
        config.currentPath.pop();
      });
      this.removeTrailingComma(config);
      config.indent--;
      config.out +=
        this.newLine(config) + this.getTabs(config.indent) + "]" + ",";
    } else if (this.getType(val) === "object") {
      this.formatAndDecorate(config, val);
    } else if (this.getType(val) === "string") {
      config.out += '"' + this.unescapeString(val) + '",';
    } else if (this.getType(val) === "number") {
      config.out += val + ",";
    } else if (this.getType(val) === "boolean") {
      config.out += val + ",";
    } else if (this.getType(val) === "null") {
      config.out += "null,";
    }
  }

  getType(value) {
    if (value && value !== this) {
      return typeof value;
    }

    return {}.toString
      .call(value)
      .match(/\s([a-z|A-Z]+)/)[1]
      .toLowerCase();
  }

  removeTrailingComma(config) {
    if (config.out.charAt(config.out.length - 1) === ",") {
      config.out = config.out.substring(0, config.out.length - 1);
    }
  }

  diffVal(val1, config1, val2, config2) {
    if (this.getType(val1) === "array") {
      this.diffArray(val1, config1, val2, config2);
    } else if (this.getType(val1) === "object") {
      if (
        ["array", "string", "number", "boolean", "null"].indexOf(
          this.getType(val2)
        ) > -1
      ) {
        this.diffs.push(
          this.generateDiff(
            config1,
            this.generatePath(config1),
            config2,
            this.generatePath(config2),
            "Both types should be objects",
            this.TYPE
          )
        );
      } else {
        this.findDiffs(config1, val1, config2, val2);
      }
    } else if (this.getType(val1) === "string") {
      if (this.getType(val2) !== "string") {
        this.diffs.push(
          this.generateDiff(
            config1,
            this.generatePath(config1),
            config2,
            this.generatePath(config2),
            "Both types should be strings",
            this.TYPE
          )
        );
      } else if (val1 !== val2) {
        this.diffs.push(
          this.generateDiff(
            config1,
            this.generatePath(config1),
            config2,
            this.generatePath(config2),
            "Both sides should be equal strings",
            this.EQUALITY
          )
        );
      }
    } else if (this.getType(val1) === "number") {
      if (this.getType(val2) !== "number") {
        this.diffs.push(
          this.generateDiff(
            config1,
            this.generatePath(config1),
            config2,
            this.generatePath(config2),
            "Both types should be numbers",
            this.TYPE
          )
        );
      } else if (val1 !== val2) {
        this.diffs.push(
          this.generateDiff(
            config1,
            this.generatePath(config1),
            config2,
            this.generatePath(config2),
            "Both sides should be equal numbers",
            this.EQUALITY
          )
        );
      }
    } else if (this.getType(val1) === "boolean") {
      this.diffBool(val1, config1, val2, config2);
    } else if (this.getType(val1) === "null" && this.getType(val2) !== "null") {
      this.diffs.push(
        this.generateDiff(
          config1,
          this.generatePath(config1),
          config2,
          this.generatePath(config2),
          "Both types should be nulls",
          this.TYPE
        )
      );
    }
  }

  diffBool(val1, config1, val2, config2) {
    if (this.getType(val2) !== "boolean") {
      this.diffs.push(
        this.generateDiff(
          config1,
          this.generatePath(config1),
          config2,
          this.generatePath(config2),
          "Both types should be booleans",
          this.TYPE
        )
      );
    } else if (val1 !== val2) {
      if (val1) {
        this.diffs.push(
          this.generateDiff(
            config1,
            this.generatePath(config1),
            config2,
            this.generatePath(config2),
            "The left side is <code>true</code> and the right side is <code>false</code>",
            this.EQUALITY
          )
        );
      } else {
        this.diffs.push(
          this.generateDiff(
            config1,
            this.generatePath(config1),
            config2,
            this.generatePath(config2),
            "The left side is <code>false</code> and the right side is <code>true</code>",
            this.EQUALITY
          )
        );
      }
    }
  }

  diffArray(val1, config1, val2, config2) {
    if (this.getType(val2) !== "array") {
      this.diffs.push(
        this.generateDiff(
          config1,
          this.generatePath(config1),
          config2,
          this.generatePath(config2),
          "Both types should be arrays",
          this.TYPE
        )
      );
      return;
    }

    if (val1.length < val2.length) {
      for (let i = val1.length; i < val2.length; i++) {
        this.diffs.push(
          this.generateDiff(
            config1,
            this.generatePath(config1),
            config2,
            this.generatePath(config2, "[" + i + "]"),
            "Missing element <code>" +
              i +
              "</code> from the array on the left side",
            this.LEFT
          )
        );
      }
    }
    val1.forEach(function(arrayVal, index) {
      if (val2.length <= index) {
        this.diffs.push(
          this.generateDiff(
            config1,
            this.generatePath(config1, "[" + index + "]"),
            config2,
            this.generatePath(config2),
            "Missing element <code>" +
              index +
              "</code> from the array on the right side",
            this.RIGHT
          )
        );
      } else {
        config1.currentPath.push("/[" + index + "]");
        config2.currentPath.push("/[" + index + "]");

        if (this.getType(val2) === "array") {
          this.diffVal(val1[index], config1, val2[index], config2);
        }
        config1.currentPath.pop();
        config2.currentPath.pop();
      }
    });
  }

  findDiffs(config1, data1, config2, data2) {
    config1.currentPath.push("/");
    config2.currentPath.push("/");
    let key;
    if (data1.length < data2.length) {
      for (key in data2) {
        if (data2.hasOwnProperty(key)) {
          if (!data1.hasOwnProperty(key)) {
            this.diffs.push(
              this.generateDiff(
                config1,
                this.generatePath(config1),
                config2,
                this.generatePath(config2, "/" + key),
                "The right side of this object has more items than the left side",
                this.MISSING
              )
            );
          }
        }
      }
    }
    for (key in data1) {
      if (data1.hasOwnProperty(key)) {
        config1.currentPath.push(key);
        if (!data2.hasOwnProperty(key)) {
          this.diffs.push(
            this.generateDiff(
              config1,
              this.generatePath(config1),
              config2,
              this.generatePath(config2),
              "Missing property <code>" +
                key +
                "</code> from the object on the right side",
              this.RIGHT
            )
          );
        } else {
          config2.currentPath.push(key);

          this.diffVal(data1[key], config1, data2[key], config2);
          config2.currentPath.pop();
        }
        config1.currentPath.pop();
      }
    }
    config1.currentPath.pop();
    config2.currentPath.pop();
    for (key in data2) {
      if (data2.hasOwnProperty(key)) {
        if (!data1.hasOwnProperty(key)) {
          this.diffs.push(
            this.generateDiff(
              config1,
              this.generatePath(config1),
              config2,
              this.generatePath(config2, key),
              "Missing property <code>" +
                key +
                "</code> from the object on the left side",
              this.LEFT
            )
          );
        }
      }
    }
  }

  generateDiff(config1, path1, config2, path2, msg, type) {
    if (path1 !== "/" && path1.charAt(path1.length - 1) === "/") {
      path1 = path1.substring(0, path1.length - 1);
    }
    if (path2 !== "/" && path2.charAt(path2.length - 1) === "/") {
      path2 = path2.substring(0, path2.length - 1);
    }
    let pathObj1 = config1.paths.find(function(path) {
      return path.path === path1;
    });
    let pathObj2 = config2.paths.find(function(path) {
      return path.path === path2;
    });

    if (!pathObj1) {
      throw "Unable to find line number for (" + msg + "): " + path1;
    }
    if (!pathObj2) {
      throw "Unable to find line number for (" + msg + "): " + path2;
    }
    return {
      path1: pathObj1,
      path2: pathObj2,
      type: type,
      msg: msg
    };
  }

  diffColor(diffs) {
    let currentTree = Object.assign({}, this.dataSource.data);
    // console.log(currentTree);
    // console.log("-----");
    diffs.forEach((diff, index) => {
      this.flatNodeMap.forEach(node => {
        // if(node.path == diff.path1.path){
        switch (diff.type) {
          // if(node.path == diff.)
          case this.RIGHT: {
            if (node.path == diff.path2.path) {
              this.database.updateItemColor(node, Colors.RED);
              console.log(node.path);
            }
            break;
          }

          case this.EQUALITY: {
            if (node.path == diff.path1.path) {
              this.database.updateItemColor(node, Colors.ORANGE);
              console.log(node.path);
            }
            break;
          }

          case this.LEFT: {
            if (node.path == diff.path1.path) {
              this.database.updateItemColor(node, Colors.GREEN);
              console.log(node.path);
            }
            break;
          }
          case this.TYPE: {
            if (node.path == diff.path1.path) {
              this.database.updateItemColor(node, Colors.RED);
              console.log(node.path);
            }
            break;
          }
          case this.MISSING: {
            if (node.path == diff.path2.path) {
              this.database.updateItemColor(node, Colors.GREEN);
              console.log(node.path);
            }
            break;
          }
        }
        // }
      });
    });
  }

  formatAndDecorateArray(config, data) {
    this.startArray(config);
    data.forEach((arrayVal, index) => {
      config.out += this.newLine(config) + this.getTabs(config.indent);
      config.paths.push({
        path: this.generatePath(config, "[" + index + "]"),
        line: config.line
      });
      config.currentPath.push("/[" + index + "]");
      this.formatVal(arrayVal, config);
      config.currentPath.pop();
    });
    this.finishArray(config);
    config.currentPath.pop();
  }

  startArray(config) {
    config.indent++;
    config.out += "[";
    if (config.paths.length === 0) {
      config.paths.push({
        path: this.generatePath(config),
        line: config.line
      });
    }
    if (config.indent === 0) {
      config.indent++;
    }
  }

  finishArray(config) {
    if (config.indent === 0) {
      config.indent--;
    }
    this.removeTrailingComma(config);
    config.indent--;
    config.out += this.newLine(config) + this.getTabs(config.indent) + "]";
    if (config.indent !== 0) {
      config.out += ",";
    } else {
      config.out += this.newLine(config);
    }
  }
}
