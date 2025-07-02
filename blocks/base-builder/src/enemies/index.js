/**
 * Enemy System Index - Exports all enemy-related modules
 */

export { EnemyMovement } from './EnemyMovement';
export { EnemyCombat } from './EnemyCombat';
export { EnemyRenderer } from './EnemyRenderer';
export { 
	ENEMY_TYPES, 
	createEnemy, 
	getEnemyTypeConfig, 
	getRandomEnemyType, 
	getEnemyReward 
} from './EnemyTypes';

// Re-export the new modular EnemyManager
export { EnemyManager } from './EnemyManager'; 