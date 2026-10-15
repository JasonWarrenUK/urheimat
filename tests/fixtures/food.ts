export const seed = 12345;
export const livelihood = {
	custom: 'livelihood',
	sources: ['herds/large', 'herds/small', 'crop/hoe', 'crop/plough', 'catch', 'hunt', 'gather'],
	labour: ['male', 'female', 'shared']
};
export const gender = { custom: 'gender', male: 'male', female: 'female', both: 'both', neither: 'neither' };
// A band that holds several sources on one pool: the herds share the pasture; the hoe and the plough
// share the soil, and large herds draw the plough.
export const sharedPool: Record<'herds' | 'soil', { numbers: number; sources: [string, string][] }> = {
	herds: { numbers: 100, sources: [['herds/large', 'shared'], ['herds/small', 'shared']] },
	soil: { numbers: 3000, sources: [['crop/hoe', 'shared'], ['crop/plough', 'shared'], ['herds/large', 'shared']] }
};
