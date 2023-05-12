import { Difficulty } from "./enums";

//Configurable 
export const BLOCK_SIZE = 25;
export const DEFAULT_DIFFICULTY = Difficulty.Easy;

// Non-Configurable (Not support dynamically)
export const FROG_SIZE = BLOCK_SIZE / 2;
export const MAP_TOTAL_COLUMN = 9; //9 Row
export const MAP_TOTAL_ROW = 9; // 9 Column
export const MAP_SIZE_COL = MAP_TOTAL_COLUMN * BLOCK_SIZE;
export const MAP_SIZE_ROW = MAP_TOTAL_ROW * BLOCK_SIZE;