import { SelectionModel } from "@angular/cdk/collections";
import { FlatTreeControl } from "@angular/cdk/tree";
import { Component, Injectable } from "@angular/core";
import {
  MatTreeFlatDataSource,
  MatTreeFlattener
} from "@angular/material/tree";
import { BehaviorSubject } from "rxjs";

/**
 * Node for to-do value
 */
export class TreeNode {
  children: TreeNode[];
  value: string;
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

/** Flat to-do value node with expandable and level information */
export class TreeFlatNode {
  value: string;
  level: number;
  color: string;
  expandable: boolean;
  propName: string;
  path: string;
}

/**
 * The Json object for to-do list data.
 */
const TREE_DATA = [
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
];

/**
 * The Json object for to-do list data.
 */
const TREE_DATAV1 = [
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
];

/**
 * Checklist database, it can build a tree structured Json object.
 * Each node in Json object represents a to-do item or a category.
 * If a node is a category, it has children items and new items can be added under the category.
 */
@Injectable()
export class TreelistDatabase {
  dataChange = new BehaviorSubject<TreeNode[]>([]);

  get data(): TreeNode[] {
    return this.dataChange.value;
  }

  constructor() {
    this.initialize();
  }

  initialize() {
    // Build the tree nodes from Json object. The result is a list of `TreeNode` with nested
    //     file node as children.
    const data = this.buildFileTree(TREE_DATA, 0);
    // console.log(data);

    // Notify the change.
    this.dataChange.next(data);
  }

  /**
   * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
   * The return value is the list of `TreeNode`.
   */
  buildFileTree(
    obj: { [key: string]: any },
    level: number,
    path: string = "/"
  ): TreeNode[] {
    return Object.keys(obj).reduce<TreeNode[]>((accumulator, key) => {
      const value = obj[key];
      const node = new TreeNode();
      node.value = key;
      node.path = path + key;
      node.color = Colors.BLACK;

      if (value != null) {
        if (typeof value === "object") {
          node.children = this.buildFileTree(value, level + 1, node.path + "/");
        } else {
          node.value = value;
          node.propName = key;
        }
      }

      return accumulator.concat(node);
    }, []);
  }

  /** Add an value to to-do list */
  insertvalue(parent: TreeNode, name: string) {
    if (parent.children) {
      parent.children.push({ value: name } as TreeNode);
      this.dataChange.next(this.data);
    }
  }

  updatevalue(node: TreeNode, name: string) {
    node.value = name;
    this.dataChange.next(this.data);
  }
  updatevalueColor(node: TreeNode, color: Colors) {
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
  providers: [TreelistDatabase]
})
export class TreeComponent {
  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeMap = new Map<TreeFlatNode, TreeNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<TreeNode, TreeFlatNode>();

  /** A selected parent node to be inserted */
  selectedParent: TreeFlatNode | null = null;

  /** The new value's name */
  newvalueName = "";

  treeControl: FlatTreeControl<TreeFlatNode>;

  treeFlattener: MatTreeFlattener<TreeNode, TreeFlatNode>;

  dataSource: MatTreeFlatDataSource<TreeNode, TreeFlatNode>;

  toStrings(obj) {
    return JSON.stringify(obj);
  }
  /** The selection for checklist */
  checklistSelection = new SelectionModel<TreeFlatNode>(true /* multiple */);

  dataTree: any;
  // data1="";
  constructor(private database: TreelistDatabase) {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this.getLevel,
      this.isExpandable,
      this.getChildren
    );
    this.treeControl = new FlatTreeControl<TreeFlatNode>(
      this.getLevel,
      this.isExpandable
    );
    this.dataSource = new MatTreeFlatDataSource(
      this.treeControl,
      this.treeFlattener
    );
    console.log("---- tree ---- ");
    this.dataTree = new TreeNode();
    // console.log(this.dataTree.getd);

    database.dataChange.subscribe(data => {
      this.dataSource.data = data;
      // console.log(this.dataSource.data);
    });

    //to code amx
    // console.log(this.dataSource.data);

    this.dataTree = TREE_DATA;
  }

  getLevel = (node: TreeFlatNode) => node.level;

  isExpandable = (node: TreeFlatNode) => node.expandable;

  getChildren = (node: TreeNode): TreeNode[] => node.children;

  getColor = (node: TreeNode) => node.color;

  getPropName = (node: TreeNode) => node.propName;

  hasChild = (_: number, _nodeData: TreeFlatNode) => _nodeData.expandable;

  hasNoContent = (_: number, _nodeData: TreeFlatNode) => _nodeData.value === "";

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: TreeNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode =
      existingNode && existingNode.value === node.value
        ? existingNode
        : new TreeFlatNode();
    flatNode.value = node.value;
    flatNode.color = node.color;
    flatNode.propName = node.propName;
    flatNode.level = level;
    flatNode.expandable = !!node.children;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  };

  /** Whether all the descendants of the node are selected. */
  descendantsAllSelected(node: TreeFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.every(child =>
      this.checklistSelection.isSelected(child)
    );
    return descAllSelected;
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(node: TreeFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some(child =>
      this.checklistSelection.isSelected(child)
    );
    return result && !this.descendantsAllSelected(node);
  }

  /** Toggle the to-do value selection. Select/deselect all the descendants node */
  TreeSelectionToggle(node: TreeFlatNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);

    // Force update for the parent
    descendants.every(child => this.checklistSelection.isSelected(child));
    this.checkAllParentsSelection(node);
  }

  /** Toggle a leaf to-do value selection. Check all the parents to see if they changed */
  todoLeafvalueSelectionToggle(node: TreeFlatNode): void {
    this.checklistSelection.toggle(node);
    this.checkAllParentsSelection(node);
  }

  /* Checks all the parents when a leaf node is selected/unselected */
  checkAllParentsSelection(node: TreeFlatNode): void {
    let parent: TreeFlatNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /** Check root node checked state and change it accordingly */
  checkRootNodeSelection(node: TreeFlatNode): void {
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
  getParentNode(node: TreeFlatNode): TreeFlatNode | null {
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

  /** Select the category so we can insert the new value. */
  addNewvalue(node: TreeFlatNode) {
    const parentNode = this.flatNodeMap.get(node);
    this.database.insertvalue(parentNode!, "");
    this.treeControl.expand(node);
  }

  /** Save the node to database */
  saveNode(node: TreeFlatNode, valueValue: string) {
    const nestedNode = this.flatNodeMap.get(node);
    this.database.updatevalue(nestedNode!, valueValue);
  }
}
