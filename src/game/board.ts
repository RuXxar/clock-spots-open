import { JOBS, jobHasTag } from './jobs';
import type { BoardSlots, JobId, KnockbackDirection, PositionGroup, PositionId, TagId } from './types';
import { POSITIONS } from './types';

export function positionIndex(position: PositionId): number {
  return POSITIONS.indexOf(position);
}

export function offsetPosition(position: PositionId, offset: number): PositionId {
  const index = positionIndex(position);
  return POSITIONS[(index + offset + POSITIONS.length * 8) % POSITIONS.length];
}

export function oppositePosition(position: PositionId): PositionId {
  return offsetPosition(position, 4);
}

export function neighborPositions(position: PositionId): [PositionId, PositionId] {
  return [offsetPosition(position, -1), offsetPosition(position, 1)];
}

export function circularDistance(a: PositionId, b: PositionId): number {
  const diff = Math.abs(positionIndex(a) - positionIndex(b));
  return Math.min(diff, POSITIONS.length - diff);
}

export function jobAt(board: BoardSlots, position: PositionId): JobId {
  return board[position];
}

export function positionOfJob(board: BoardSlots, jobId: JobId): PositionId {
  const found = POSITIONS.find((position) => board[position] === jobId);
  if (!found) {
    throw new Error(`Job ${jobId} is not on this board`);
  }
  return found;
}

export function jobTagAt(board: BoardSlots, position: PositionId, tag: TagId): boolean {
  return jobHasTag(jobAt(board, position), tag);
}

export function roleAt(board: BoardSlots, position: PositionId) {
  return JOBS[jobAt(board, position)].role;
}

export function positionsInGroup(group: PositionGroup): PositionId[] {
  switch (group) {
    case 'cardinal':
      return ['N', 'E', 'S', 'W'];
    case 'intercardinal':
      return ['NE', 'SE', 'SW', 'NW'];
    case 'north':
      return ['NW', 'N', 'NE'];
    case 'south':
      return ['SW', 'S', 'SE'];
    case 'east':
      return ['NE', 'E', 'SE'];
    case 'west':
      return ['NW', 'W', 'SW'];
    default:
      return [...POSITIONS];
  }
}

export function applyKnockback(position: PositionId, direction?: KnockbackDirection): PositionId {
  if (!direction) {
    return position;
  }

  const northToSouth: Partial<Record<PositionId, PositionId>> = { NW: 'SW', N: 'S', NE: 'SE' };
  const southToNorth: Partial<Record<PositionId, PositionId>> = { SW: 'NW', S: 'N', SE: 'NE' };
  const eastToWest: Partial<Record<PositionId, PositionId>> = { NE: 'NW', E: 'W', SE: 'SW' };
  const westToEast: Partial<Record<PositionId, PositionId>> = { NW: 'NE', W: 'E', SW: 'SE' };

  switch (direction) {
    case 'north':
      return northToSouth[position] ?? position;
    case 'south':
      return southToNorth[position] ?? position;
    case 'east':
      return eastToWest[position] ?? position;
    case 'west':
      return westToEast[position] ?? position;
  }
}

export function transformedJobPosition(board: BoardSlots, jobId: JobId, direction?: KnockbackDirection): PositionId {
  return applyKnockback(positionOfJob(board, jobId), direction);
}

export function swapSlots(board: BoardSlots, a: PositionId, b: PositionId): BoardSlots {
  if (a === b) {
    return board;
  }

  return {
    ...board,
    [a]: board[b],
    [b]: board[a],
  };
}

export function sameBoard(a: BoardSlots, b: BoardSlots): boolean {
  return POSITIONS.every((position) => a[position] === b[position]);
}

export function boardFromJobs(jobs: JobId[]): BoardSlots {
  if (jobs.length !== POSITIONS.length) {
    throw new Error('A board needs exactly eight jobs');
  }

  return POSITIONS.reduce((slots, position, index) => {
    slots[position] = jobs[index];
    return slots;
  }, {} as BoardSlots);
}
