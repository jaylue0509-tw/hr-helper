import { SimulationNodeDatum, SimulationLinkDatum } from 'd3';

export interface Person {
  id: string;
  name: string;
  department?: string;
  attended?: boolean;
  checkInTime?: number;
}

export interface Group {
  id: number;
  name: string;
  members: Person[];
}

export enum AppMode {
  INPUT = 'INPUT',
  DRAW = 'DRAW',
  GROUP = 'GROUP',
  ATTENDANCE = 'ATTENDANCE',
}

export interface DrawHistoryItem {
  timestamp: number;
  winner: Person;
}

export interface Node extends SimulationNodeDatum {
  id: string;
  group?: number;
  name?: string;
  r?: number;
  color?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface Link extends SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  value?: number;
}