// assets/js/services/storage-service.js

const SPACES_KEY = 'cognispace-spaces';

export async function getSpaces() {
    try {
        const result = await chrome.storage.local.get(SPACES_KEY);
        return result[SPACES_KEY] || [];
    } catch (error) {
        console.error("Error getting spaces:", error);
        return [];
    }
}

export async function saveSpaces(spaces) {
    try {
        await chrome.storage.local.set({ [SPACES_KEY]: spaces });
    } catch (error) {
        console.error("Error saving spaces:", error);
    }
}

export async function addSpace(newSpace) {
    const spaces = await getSpaces();
    newSpace.id = Date.now();
    spaces.push(newSpace);
    await saveSpaces(spaces);
}

export async function getSpaceById(id) {
    const spaces = await getSpaces();
    return spaces.find(space => space.id === id) || null;
}

export async function addSourceToSpace(spaceId, newSource) {
    const spaces = await getSpaces();
    const spaceIndex = spaces.findIndex(space => space.id === spaceId);
    if (spaceIndex > -1) {
        spaces[spaceIndex].sources.unshift(newSource);
        await saveSpaces(spaces);
    } else {
        // console.error(`Could not find space with ID ${spaceId}`);
    }
}

/**
 * Removes a source from a specific space by its URL.
 * @param {number} spaceId - The ID of the space to update.
 * @param {string} sourceUrl - The URL of the source to remove.
 * @returns {Promise<void>}
 */
export async function removeSourceFromSpace(spaceId, sourceUrl) {
    const spaces = await getSpaces();
    const spaceIndex = spaces.findIndex(space => space.id === spaceId);
    if (spaceIndex > -1) {
        spaces[spaceIndex].sources = spaces[spaceIndex].sources.filter(s => s.url !== sourceUrl);
        await saveSpaces(spaces);
        // console.log(`Source removed from space ${spaceId}`);
    } else {
        // console.error(`Could not find space with ID ${spaceId}`);
    }
}