// Pin priority is independent of the selected ordering for ordinary projects.
export function compareProjects(a, b, sortOrder = 'newest') {
    if (Boolean(a.pinnedAt) !== Boolean(b.pinnedAt)) return a.pinnedAt ? -1 : 1;
    if (a.pinnedAt && a.pinnedAt !== b.pinnedAt) {
        // Server timestamps use UTC and fixed microsecond precision.
        return b.pinnedAt.localeCompare(a.pinnedAt);
    }
    return sortOrder === 'name'
        ? a.projectName.localeCompare(b.projectName, 'zh-CN')
        : (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
}
