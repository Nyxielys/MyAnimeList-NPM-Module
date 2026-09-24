const crypto = require("node:crypto");
const { MalError } = require("./internal_systems/MalError.js");
const { URLSearchParams } = require("node:url");

class MyAnimeList {
    constructor(datas) {
        this.client_id = datas.client_id;
        this.client_secret = datas.client_secret;
    }

    async #request(url, options = {}) {
        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = await response.text();
                }

                const message = errorData?.message || errorData?.error || `MAL API Error: HTTP ${response.status}`;

                throw new MalError(message, response.status, errorData)
            }

            const data = await response.json();
            return data;
        } catch (error) {
            if (error instanceof MalError) {
                throw error;
            }

            throw new MalError(`Network error: ${error.message}`, null, null)
        }
    }

    async #checkIfHasParams(type) {
        if (type === 'all') {
            const requiredSettings = [
                { key: this.client_id, name: "client_id", type: "string" },
                { key: this.client_secret, name: "client_secret", type: "string" }
            ]

            const missingSettings = requiredSettings.find(setting => !setting.key)

            if (missingSettings) {
                return {
                    success: true,
                    isMissing: true,
                    error: `Require ${missingSettings.name}:
new MyAnimeList({
    ${missingSettings.name}: ${missingSettings.type}
})`,
                }
            } else {
                return {
                    success: true,
                    isMissing: false
                }
            }
        } else if (type === 'only_client_id') {
            const requiredSettings = [
                { key: this.client_id, name: "client_id", type: "string" }
            ]

            const missingSettings = requiredSettings.find(setting => !setting.key)

            if (missingSettings) {
                return {
                    success: true,
                    isMissing: true,
                    error: `Require ${missingSettings.name}:
new MyAnimeList({
    ${missingSettings.name}: ${missingSettings.type}
})`,
                }
            } else {
                return {
                    success: true,
                    isMissing: false
                }
            }
        } else {
            return {
                success: false,
                error: `Erreur interne au module myanimelist-module (checkIfHasParams(type))`
            }
        }
    }

    async getAnimeInfo(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id');
        if (hasForgetParam.error) {
            throw new MalError(hasForgetParam.error)
        }

        var anime_name = settings?.name
        if (!anime_name || typeof anime_name != "string") throw new MalError("Require name: getAnimeInfo({ name: string })");

        var offset = settings?.offset ?? ''
        if (offset != '' && isNaN(offset)) throw new MalError(`The "offset" field must be a valid positive number.`);
        if (offset != '') offset = `&offset=${offset}`

        var limit = settings?.limit ?? ''
        if (limit != '' && (isNaN(limit) || limit > 500)) throw new MalError(`The "limit" field must be a valid positive number (<=500).`);
        if (limit != '') limit = `&limit=${limit}`

        var fields = settings?.fields ?? []
        if (fields.length > 0) fields = `&fields=${fields.map(field => field).join(',')}`

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }

        var editedAnimeName = anime_name.split(/[:–—]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim()
        if (editedAnimeName.split(" ").length > 8) {
            editedAnimeName = editedAnimeName.split(" ").slice(0, 8).join(" ")
        }

        const url = `https://api.myanimelist.net/v2/anime?q=${encodeURIComponent(editedAnimeName)}${offset}${limit}${fields}${nsfw}`
        const options = {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': this.client_id
            }
        }

        const data = await this.#request(url, options);

        return data;
    }

    async getAnimeInfoByURL(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error)

        var url = settings?.api_url
        if (!url) throw new MalError("Require api_url: getAnimeInfoByURL({ api_url: string })");
        if (!url.includes('api.myanimelist.net/v2/anime')) throw new MalError("Invalid URL.");

        const options = {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': this.client_id
            }
        };

        const data = await this.#request(url, options);
        return data;
    }

    async getSpecificAnimeInfo(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error);

        var anime_name = settings?.name;
        if (!anime_name || typeof anime_name != "string") throw new MalError("Require name: getSpecificAnimeInfo({ name: string })");

        var fields = settings?.fields ?? []
        if (!Array.isArray(fields)) throw new MalError(`The "fields" field must be a list: getSpecificAnimeInfo({ fields: [array] })`);
        await fields.push("alternative_titles")
        if (fields.length > 0) fields = `&fields=${fields.map(field => field).join(',')}`

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }

        var editedAnimeName = anime_name.split(/[:–—-]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim()
        if (editedAnimeName.split(" ").length > 8) {
            editedAnimeName = editedAnimeName.split(" ").slice(0, 8).join(" ")
        }

        const url = `https://api.myanimelist.net/v2/anime?q=${encodeURIComponent(editedAnimeName)}${fields}${nsfw}`
        const options = {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': this.client_id
            }
        }

        var data = await this.#request(url, options);

        try {
            var requestedData = data.data
            const animeInfos = requestedData.find(anime => {
                const anime_data = anime.node

                const title = anime_data.title?.toLowerCase() || ""
                var editedTitle = title.split(/[:–—-]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim()

                const enTitle = anime_data.alternative_titles?.en.toLowerCase() || ""
                var editedEnTitle = enTitle.split(/[:–—-]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim()

                const synonyms = anime_data.alternative_titles?.synonyms || []
                var editedSynonyms = []

                for (let i = 0; i < synonyms.length; i++) {
                    editedSynonyms.push(synonyms[i].split(/[:–—-]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim())
                }

                const searchedAnime = anime_name?.toLowerCase() || ""
                var editedSearchedAnime = searchedAnime.split(/[:–—-]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim()

                return editedTitle === editedSearchedAnime || editedEnTitle === editedSearchedAnime || editedSynonyms.some(syn => syn.toLowerCase() === editedSearchedAnime)
            })

            if (animeInfos) data = animeInfos
        } catch (err) {
            return data;
        }

        return data;
    }

    async getAnimeInfoByID(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error);

        var anime_id = settings?.id
        if (!anime_id) throw new MalError(`Require id (number >0): getAnimeInfoByID({ id: number })`)
        if (isNaN(anime_id)) throw new MalError(`The "id" field must be a valid positive number.`);

        var fields = settings?.fields ?? []
        if (!Array.isArray(fields)) throw new MalError(`The "fields" field must be a list: getAnimeInfoByID({ fields: [array] })`);
        if (fields.length > 0) fields = `&fields=${fields.map(field => field).join(',')}`

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `?nsfw=true` } else { nsfw = `?nsfw=false` }

        const url = `https://api.myanimelist.net/v2/anime/${anime_id}${nsfw}${fields}`;
        const options = {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': this.client_id
            }
        };
        const data = await this.#request(url, options);

        return data;
    }

    async getAnimeRanking(settings) {
        const available_ranking_type = ["all", "airing", "upcoming", "tv", "ova", "movie", "special", "bypopularity", "favorite"]

        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error);

        var ranking_type = settings?.type ?? "all"
        if (!available_ranking_type.includes(ranking_type)) throw new MalError(`Please use a valid ranking type: ${available_ranking_type.map(f => f).join(', ')}`);

        var fields = settings?.fields ?? [];
        if (!Array.isArray(fields)) throw new MalError(`The "fields" field must be a list: getAnimeRanking({ fields: [array] })`);
        if (fields.length > 0) fields = `&fields=${fields.map(field => field).join(',')}`

        var limit = settings?.limit ?? ''
        if (limit != '' && (isNaN(limit) || limit > 500)) throw new MalError(`The "limit" field must be a valid positive number (<=500).`)
        if (limit != '') limit = `&limit=${limit}`

        var offset = settings?.offset ?? ''
        if (offset != '' && isNaN(offset) && limit.toString() != '0') throw new MalError(`The "offset" field must be a valid positive number.`)
        if (offset != '') offset = `&offset=${offset}`

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }

        const url = `https://api.myanimelist.net/v2/anime/ranking?ranking_type=${ranking_type}${fields}${limit}${offset}${nsfw}`;
        const options = {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': this.client_id
            }
        };

        const data = await this.#request(url, options);

        return data;
    }

    async getSeasonalAnime(settings) {
        const seasonsList = ['winter', 'spring', 'summer', 'fall']
        async function getSeason() {
            var data = new Date()
            var month = data.getUTCMonth()

            var index = Number(month)
            if (index <= 2) {
                return seasonsList[0]
            } else if (index > 2 && index <= 5) {
                return seasonsList[1]
            } else if (index > 5 && index <= 8) {
                return seasonsList[2]
            } else if (index > 8 && index <= 11) {
                return seasonsList[3]
            }
        }

        async function getYear() {
            var date = new Date()
            var year = date.getUTCFullYear()

            return year
        }

        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error);

        var season = settings?.season ?? await getSeason()
        if (!seasonsList.includes(season)) throw new MalError(`Please use a valid season: ${seasonsList.map(f => f).join(', ')}`);

        var year = settings?.year ?? await getYear()
        if (isNaN(year)) throw new MalError(`The "year" field must be a valid positive number.`);

        var fields = settings?.fields ?? []
        if (!Array.isArray(fields)) throw new MalError(`The "fields" field must be a list: getSeasonalAnime({ fields: [array] })`)
        if (fields.length > 0) fields = `&fields=${fields.map(field => field).join(',')}`

        var limit = settings?.limit ?? ''
        if (limit != '' && (isNaN(limit) || limit > 500)) throw new MalError(`The "limit" field must be a valid positive number (<=500).`);
        if (limit != '') limit = `&limit=${limit}`

        var offset = settings?.offset ?? 0
        if (offset != '' && isNaN(offset) && limit.toString() != '0') throw new MalError(`The "offset" field must be a valid positive number.`);

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }

        const url = `https://api.myanimelist.net/v2/anime/season/${year}/${season}?offset=${offset}${limit}${fields}${nsfw}`
        const options = {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': this.client_id
            }
        };

        const data = await this.#request(url, options);

        return data;
    }

    async getMangaInfo(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error);

        var manga_name = settings?.name;
        if (!manga_name || typeof manga_name != "string") throw new MalError(`Require name: getMangaInfo({ name: string })`)

        var offset = settings?.offset ?? ''
        if (offset != '' && isNaN(offset)) throw new MalError(`The "offset" field must be a valid positive number.`)
        if (offset != '') offset = `&offset=${offset}`

        var limit = settings?.limit ?? ''
        if (limit != '' && (isNaN(limit) || limit > 500)) throw new MalError(`The "limit" field must be a valid positive number (<=500).`)
        if (limit != '') limit = `&limit=${limit}`

        var fields = settings?.fields ?? []
        if (fields.length > 0) fields = `&fields=${fields.map(field => field).join(',')}`

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }



        var editedMangaName = manga_name.split(/[:–—]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim()
        if (editedMangaName.split(" ").length > 8) {
            editedMangaName = editedMangaName.split(" ").slice(0, 8).join(" ")
        }

        const url = `https://api.myanimelist.net/v2/manga?q=${encodeURIComponent(editedMangaName)}${offset}${limit}${fields}${nsfw}`
        const options = {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': this.client_id
            }
        }

        const data = await this.#request(url, options);

        return data;
    }

    async getMangaInfoByURL(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error);

        var url = settings?.api_url
        if (!url) throw new MalError(`Require api_url: getMangaInfoByURL({ api_url: string })`)
        if (!url.includes('api.myanimelist.net/v2/manga')) throw new MalError("Invalid URL.");

        const options = {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': this.client_id
            }
        }

        const data = await this.#request(url, options);

        return data;
    }

    async getSpecificMangaInfo(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error);

        var manga_name = settings?.name
        if (!manga_name) throw new MalError(`Require name: getSpecificMangaInfo({ name: string })`);

        var fields = settings?.fields ?? []
        if (!Array.isArray(fields)) throw new MalError(`The "fields" field must be a list: getSpecificMangaInfo({ fields: [array] })`);
        await fields.push("alternative_titles")
        if (fields.length > 0) fields = `&fields=${fields.map(field => field).join(',')}`

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }

        var editedMangaName = manga_name.split(/[:–—-]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim()
        if (editedMangaName.split(" ").length > 8) {
            editedMangaName = editedMangaName.split(" ").slice(0, 8).join(" ")
        }

        const url = `https://api.myanimelist.net/v2/manga?q=${encodeURIComponent(editedMangaName)}${fields}${nsfw}`
        const options = {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': this.client_id
            }
        }

        var data = await this.#request(url, options);

        try {
            var requestedData = data.data
            const mangaInfos = requestedData.find(manga => {
                const manga_data = manga.node

                const title = manga_data.title?.toLowerCase() || ""
                var editedTitle = title.split(/[:–—-]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim()

                const enTitle = manga_data.alternative_titles?.en.toLowerCase() || ""
                var editedEnTitle = enTitle.split(/[:–—-]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim()

                const synonyms = manga_data.alternative_titles?.synonyms || []
                var editedSynonyms = []

                for (let i = 0; i < synonyms.length; i++) {
                    editedSynonyms.push(synonyms[i].split(/[:–—-]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim())
                }

                const searchedManga = manga_name?.toLowerCase() || ""
                var editedSearchedManga = searchedManga.split(/[:–—-]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim()

                return editedTitle === editedSearchedManga || editedEnTitle === editedSearchedManga || editedSynonyms.some(syn => syn.toLowerCase() === editedSearchedManga)
            })

            if (mangaInfos) data = mangaInfos
        } catch (err) {
            return data;
        }

        return data;
    }

    async getMangaInfoByID(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error);

        var manga_id = settings?.id
        if (!manga_id) throw new MalError(`Require id (number >0): getMangaInfoByID({ id: number })`)
        if (isNaN(manga_id)) throw new MalError(`The "id" field must be a valid positive number.`)

        var fields = settings?.fields ?? []
        if (!Array.isArray(fields)) throw new MalError(`The "fields" field must be a list: getMangaInfoByID({ fields: [array] })`)
        if (fields.length > 0) fields = `&fields=${fields.map(field => field).join(',')}`

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `?nsfw=true` } else { nsfw = `?nsfw=false` }

        const url = `https://api.myanimelist.net/v2/manga/${manga_id}${nsfw}${fields}`
        const options = {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': this.client_id
            }
        }

        const data = await this.#request(url, options);

        return data;
    }

    async getMangaRanking(settings) {
        const available_ranking_type = ["all", "manga", "novels", "oneshots", "doujin", "manhwa", "manhua", "bypopularity", "favorite"]

        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error)

        var ranking_type = settings?.type ?? "all"
        if (!available_ranking_type.includes(ranking_type)) throw new MalError(`Please use a valid ranking type: ${available_ranking_type.map(f => f).join(', ')}`);

        var fields = settings?.fields ?? []
        if (!Array.isArray(fields)) throw new MalError(`The "fields" field must be a list: getMangaRanking({ fields: [array] })`);
        if (fields.length > 0) fields = `&fields=${fields.map(field => field).join(',')}`

        var limit = settings?.limit ?? ''
        if (limit != '' && (isNaN(limit) || limit > 500)) throw new MalError(`The "limit" field must be a valid positive number (<=500).`);
        if (limit != '') limit = `&limit=${limit}`

        var offset = settings?.offset ?? ''
        if (offset != '' && isNaN(offset) && limit.toString() != '0') throw new MalError(`The "offset" field must be a valid positive number.`);
        if (offset != '') offset = `&offset=${offset}`

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }

        const url = `https://api.myanimelist.net/v2/manga/ranking?ranking_type=${ranking_type}${fields}${limit}${offset}${nsfw}`
        const options = {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': this.client_id
            }
        }

        const data = await this.#request(url, options);

        return data;
    }

    async getAllBoards(settings) {
        const validCategories = ["MyAnimeList", "Anime & Manga", "General", "Archive"];

        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error);

        var selectedCategory = settings?.categories
        if (selectedCategory && selectedCategory?.length > 0) {
            if (!Array.isArray(selectedCategory)) throw new MalError('The "categories" field must be a list: getAllBoards({ categories: array })');

            for (let i = 0; i < selectedCategory?.length; i++) {
                if (!validCategories.includes(selectedCategory[i])) throw new MalError(`Please use valid categories: ${validCategories.map(c => c).join(', ')}`);
            }
        }

        const url = 'https://api.myanimelist.net/v2/forum/boards';
        const options = {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': this.client_id
            }
        }

        const data = await this.#request(url, options);
        var requestedData = []

        if (selectedCategory && selectedCategory?.length > 0) {
            for (let i = 0; i < data.categories.length; i++) {
                if (selectedCategory.includes(data.categories[i].title)) {
                    requestedData.push(data.categories[i])
                }
            }
        } else {
            requestedData = data.categories
        }

        return requestedData;

    }

    async getBoardTopics(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error);

        var boardId = settings?.board_id ?? null
        if (boardId && isNaN(boardId)) throw new MalError(`The "board_id" field must be a number: getBoardTopics({ board_id: number })`);
        if (boardId) boardId = `&board_id=${boardId}`
        else boardId = ""

        var subboard_id = settings?.subboard_id ?? null
        if (subboard_id && isNaN(subboard_id)) throw new MalError(`The "subboard_id" field must be a number: getBoardTopics({ subboard_id: number })`);
        if (subboard_id) subboard_id = `&subboard_id=${subboard_id}`
        else subboard_id = ""

        var limit = settings?.limit ?? 10
        if (isNaN(limit) || limit > 100) throw new MalError(`The "limit" field must be a number: getBoardTopics({ limit: number (must be <= 100) })`);

        var offset = settings?.offset ?? 0
        if (isNaN(offset)) throw new MalError(`The "offset" field must be a number: getBoardTopics({ offset: number })`);

        var search = settings?.search ?? null
        if (search && typeof (search) != "string") throw new MalError(`The "search" field must be a string: getBoardTopics({ search: string })`);

        if (search) search = `&q=${encodeURIComponent(search)}`
        else search = ""

        var topic_username = settings?.topic_username ?? null
        if (topic_username && typeof (topic_username) != "string") throw new MalError(`The "topic_username" field must be a string: getBoardTopics({ topic_username: string })`);

        if (topic_username) topic_username = `&topic_user_name=${encodeURIComponent(topic_username)}`
        else topic_username = ""

        var username = settings?.username ?? null
        if (username && typeof (username) != "string") throw new MalError(`The "username" field must be a string: getBoardTopics({ username: string })`);

        if (username) username = `&user_name=${encodeURIComponent(username)}`
        else username = ""

        if (boardId === "" && subboard_id === "" && search === "" && topic_username === "" && username === "") {
            throw new MalError(`Please define at least one search parameter from the following: board_id, subboard_id, search, topic_username, username`);
        }

        const url = `https://api.myanimelist.net/v2/forum/topics?limit=${limit}&offset=${offset}${boardId}${subboard_id}${search}${topic_username}${username}`;
        const options = {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': this.client_id
            }
        }

        const data = await this.#request(url, options);

        return data;

    }

    async getBoardTopicsByURL(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error);

        const url = settings?.api_url ?? null;
        if (!url) throw new MalError(`Require api_url: getBoardTopicsByURL({ api_url: string })`);
        if (!url.includes('api.myanimelist.net/v2/forum/topics')) throw new MalError("Invalid URL.");

        const options = {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': this.client_id
            }
        }

        const data = await this.#request(url, options);

        return data;
    }

    async getTopicDetails(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error);

        const topicID = settings?.topic_id ?? null;
        if (!topicID || isNaN(topicID)) throw new MalError("Please provide the topic ID: getTopicDetails({ topic_id: number })");

        var limit = settings?.limit ?? 10
        if (isNaN(limit) || limit > 100) throw new MalError(`The "limit" field must be a number: getTopicDetails({ limit: number (must be <= 100) })`);

        var offset = settings?.offset ?? 0
        if (isNaN(offset)) throw new MalError(`The "offset" field must be a number: getTopicDetails({ offset: number })`);

        const url = `https://api.myanimelist.net/v2/forum/topic/${topicID}?limit=${limit}&offset=${offset}`;
        const options = {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': this.client_id
            }
        }

        const data = await this.#request(url, options);

        return data;
    }

    async getTopicDetailsByURL(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error);

        const url = settings?.api_url ?? null;
        if (!url) throw new MalError(`Require api_url: getTopicDetailsByURL({ api_url: string })`);
        if (!url.includes('api.myanimelist.net/v2/forum/topic/')) throw new MalError("Invalid URL.");

        const options = {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': this.client_id
            }
        }

        const data = await this.#request(url, options);

        return data;
    }

    // OAuth2

    async generatePKCE() {
        const verifier = await crypto.randomBytes(64).toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        return { verifier, challenge: verifier };
    }

    async generateAuthURL(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error);

        const challenge = settings?.challenge ?? null
        if (!challenge || typeof (challenge) != "string") throw new MalError("Please provide the challenge: generateAuthURL({ challenge: string })");

        const redirectURI = settings?.redirect_uri ?? null
        if (!redirectURI || typeof (redirectURI) != "string") throw new MalError("Please provide the redirect URI: generateAuthURL({ redirect_uri: string })");

        const parameter = new URLSearchParams({
            response_type: 'code',
            client_id: this.client_id,
            code_challenge: challenge,
            code_challenge_method: 'plain',
            redirect_uri: redirectURI
        });

        const url = `https://myanimelist.net/v1/oauth2/authorize?${parameter.toString()}`;
        return url
    }

    async authorize(settings) {
        const hasForgetParam = await this.#checkIfHasParams('all')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error);

        const code = settings?.code ?? null;
        if (!code || typeof (code) != "string") throw new MalError("Please provide the code: authorize({ code: string })");

        const verifier = settings?.verifier ?? null;
        if (!verifier || typeof (verifier) != "string") throw new MalError("Please provide the verifier: authorize({ verifier: string })");

        const redirectURI = settings?.redirect_uri ?? null;
        if (!redirectURI || typeof (redirectURI) != "string") throw new MalError("Please provide the redirect URI: authorize({ redirect_uri: string })");

        const parameter = new URLSearchParams({
            client_id: this.client_id,
            client_secret: this.client_secret,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirectURI,
            code_verifier: verifier
        });

        const url = 'https://myanimelist.net/v1/oauth2/token'
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: parameter.toString()
        }

        const tokens = await this.#request(url, options);
        return tokens;
    }

    async refreshToken(settings) {
        const hasForgetParam = await this.#checkIfHasParams('all')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error);

        const refreshToken = settings?.refresh_token ?? null;
        if (!refreshToken || typeof(refreshToken) != "string") {
            throw new MalError("Please provide the refresh token: refreshToken({ refresh_token: string })");
        }

        const parameter = new URLSearchParams({
            client_id: this.client_id,
            client_secret: this.client_secret,
            grant_type: "refresh_token",
            refresh_token: refreshToken
        });

        const url = "https://myanimelist.net/v1/oauth2/token";
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: parameter.toString()
        };

        const tokens = this.#request(url, options);
        return tokens;
    }

    // Il faut ajouter les fonctions pour utiliser le token
}

module.exports = {
    MyAnimeList,
    MalError
}