import {compareProjects} from './projectSort';

const ordinary = {id: 'ordinary', projectName: 'A', createdAt: '2026-11-10'};
const oldPin = {id: 'old', projectName: 'B', pinnedAt: '2026-11-01T00:00:00.000001+00:00'};
const newPin = {id: 'new', projectName: 'Z', pinnedAt: '2026-11-01T00:00:00.000002+00:00'};

test.each(['name', 'newest'])('pins stay first with microsecond order under %s sorting', order => {
    expect([ordinary, oldPin, newPin].sort((a,b) => compareProjects(a,b,order)).map(p=>p.id))
        .toEqual(['new','old','ordinary']);
});

test('unpin restores the selected ordinary sort order', () => {
    const unpinned = {...newPin, pinnedAt: null, createdAt: '2026-11-11'};
    expect([ordinary, unpinned].sort((a,b)=>compareProjects(a,b,'newest'))[0]).toBe(unpinned);
    expect([unpinned, ordinary].sort((a,b)=>compareProjects(a,b,'name'))[0]).toBe(ordinary);
});
