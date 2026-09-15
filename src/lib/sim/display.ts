import type { MapTerrain } from '$lib/types';

export const TERRAIN_COLOUR: Record<MapTerrain, string> = {
	water: '#2b4a6b',
	coast: '#7d9c86',
	marsh: '#4f6a4a',
	river: '#6f8f5a',
	forest: '#3f5a36',
	steppe: '#a08d52',
	desert: '#c2a069',
	mountain: '#6e6459'
};

export const TERRAIN_LABEL: Record<MapTerrain, string> = {
	water: 'Sea',
	coast: 'Coast',
	marsh: 'Marsh',
	river: 'River valley',
	forest: 'Forest',
	steppe: 'Steppe',
	desert: 'Desert',
	mountain: 'Mountains'
};

export const CULTURE_COLOUR = [
	'#e6dcc6',
	'#c99a47',
	'#6fae95',
	'#c8603f',
	'#9fb3d8',
	'#d69bc4',
	'#8fd0d8',
	'#e0c48a',
	'#b0b0b0',
	'#8fbf6f'
];
