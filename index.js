const crypto = require("node:crypto");
const { MalError } = require("./internal_systems/MalError.js");
const { URLSearchParams } = require("node:url");

const availableGlobalFields = ["id", "title", "main_picture", "alternative_titles", "start_date", "end_date", "synopsis", "mean", "rank", "popularity", "num_list_users", "nsfw", "genres", "created_at", "updated_at", "media_type", "status", "my_list_status", "num_scoring_users"];
const availableAnimeFields = ["num_episodes", "start_season", "broadcast", "source", "average_episode_duration", "rating", "studios"];
const availableMangaFields = ["num_volumes", "num_chapters", "authors"];
const availableUserProfileFields = ["id", "name", "picture", "gender", "birthday", "location", "joined_at", "anime_statistics", "time_zone", "is_supporter"];

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

    async #checkParam(funct, parameter, value, minValue, maxValue) {
        if (value >= minValue && (value <= maxValue || maxValue === null) && typeof (value) === "number") {
            return;
        } else {
            throw new MalError(`"${parameter}" must be a number between ${minValue} and ${maxValue ?? "infinite"}: ${funct}({ ${parameter}: number })`);
        }
    }

    async #checkFields(funct, type, parameter, tab) {
        if (!Array.isArray(tab) && tab !== null) throw new MalError(`The "fields" field must be an array: ${funct}({ fields: array })`);

        let availableFields;
        if (type === "anime") {
            availableFields = availableGlobalFields.concat(availableAnimeFields);
        } else if (type === "manga") {
            availableFields = availableGlobalFields.concat(availableMangaFields);
        } else if (type === "user") {
            availableFields = availableUserProfileFields;
        }

        if (tab !== null && tab.length > 0) {
            for (let i = 0; i < tab.length; i++) {
                if (!availableFields.includes(tab[i])) {
                    throw new MalError(`${tab[i]} isn't an available field. Here are valid fields: ${availableFields.join(', ')}`);
                }
            }

            tab = `&${parameter}=${tab.join(',')}`
        } else {
            tab = ''
        }

        return tab;
    }

    async getAnimeInfo(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id');
        if (hasForgetParam.error) {
            throw new MalError(hasForgetParam.error)
        }

        var token = settings?.token ?? null;
        if (token && typeof (token) != "string") throw new MalError(`Please provide a valid token: getAnimeInfo({ token: string })`);

        var anime_name = settings?.name
        if (!anime_name || typeof anime_name != "string") throw new MalError("Require name: getAnimeInfo({ name: string })");

        var offset = settings?.offset ?? 0;
        await this.#checkParam("getAnimeInfo", "offset", offset, 0, null);

        var limit = settings?.limit ?? 10;
        await this.#checkParam("getAnimeInfo", "limit", limit, 1, 100);

        var fields = settings?.fields ?? null;
        fields = await this.#checkFields("getAnimeInfo", "anime", "fields", fields);

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }

        var editedAnimeName = anime_name.split(/[:–—]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim()
        if (editedAnimeName.split(" ").length > 8) {
            editedAnimeName = editedAnimeName.split(" ").slice(0, 8).join(" ")
        }

        const url = `https://api.myanimelist.net/v2/anime?q=${encodeURIComponent(editedAnimeName)}&offset=${offset}&limit=${limit}${fields}${nsfw}`
        var options
        if (!token) {
            options = {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            }
        } else {
            options = {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        }

        const data = await this.#request(url, options);

        return data;
    }

    async getAnimeInfoByURL(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error);

        var url = settings?.api_url
        if (!url) throw new MalError("Require api_url: getAnimeInfoByURL({ api_url: string })");
        if (!url.includes('api.myanimelist.net/v2/anime')) throw new MalError("Invalid URL.");

        var token = settings?.token ?? null;
        if (token && typeof (token) != "string") throw new MalError(`Please provide a valid token: getAnimeInfoByURL({ token: string })`);

        var options
        if (!token) {
            options = {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            }
        } else {
            options = {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        }

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

        var token = settings?.token ?? null;
        if (token && typeof (token) != "string") throw new MalError(`Please provide a valid token: getSpecificAnimeInfo({ token: string })`);

        var options
        if (!token) {
            options = {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            }
        } else {
            options = {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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
        const availableFields = ["id", "title", "main_picture", "alternative_titles", "start_date", "end_date", "synopsis", "mean", "rank", "popularity", "num_list_users", "nsfw", "genres", "created_at", "updated_at", "media_type", "status", "my_list_status", "num_episodes", "start_season", "broadcast", "source", "average_episode_duration", "rating", "studios"];

        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error);

        var anime_id = settings?.id
        if (!anime_id) throw new MalError(`Require id (number >0): getAnimeInfoByID({ id: number })`)
        if (isNaN(anime_id)) throw new MalError(`The "id" field must be a valid positive number.`);

        var fields = settings?.fields ?? null;
        if (fields !== null && !Array.isArray(fields)) throw new MalError(`"fields" must be an array: getAnimeInfoByID({ fields: array })`);
        if (fields !== null) {
            for (let i = 0; i < fields.length; i++) {
                if (!availableFields.includes(fields[i])) {
                    throw new MalError(`Please provide valid fields: ${availableFields.join(', ')}`);
                }
            }
            fields = `&fields=${fields.join(',')}`
        } else {
            fields = ""
        }

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `?nsfw=true` } else { nsfw = `?nsfw=false` }

        const url = `https://api.myanimelist.net/v2/anime/${anime_id}${nsfw}${fields}`;

        var token = settings?.token ?? null;
        if (token && typeof (token) != "string") throw new MalError(`Please provide a valid token: getAnimeInfoByID({ token: string })`);

        var options
        if (!token) {
            options = {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            }
        } else {
            options = {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        }

        const data = await this.#request(url, options);
        return data;
    }

    async getAnimeRanking(settings) {
        const available_ranking_type = ["all", "airing", "upcoming", "tv", "ova", "movie", "special", "bypopularity", "favorite"];

        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error);

        var ranking_type = settings?.type ?? "all"
        if (!available_ranking_type.includes(ranking_type)) throw new MalError(`Please use a valid ranking type: ${available_ranking_type.map(f => f).join(', ')}`);

        var fields = settings?.fields ?? null;
        fields = await this.#checkFields("getAnimeRanking", "anime", "fields", fields);

        var limit = settings?.limit ?? 20
        await this.#checkParam("getAnimeRanking", "limit", limit, 1, 500);

        var offset = settings?.offset ?? 0
        await this.#checkParam("getAnimeRanking", "offset", offset, 0, null);

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }

        const url = `https://api.myanimelist.net/v2/anime/ranking?ranking_type=${ranking_type}${fields}&limit=${limit}&offset=${offset}${nsfw}`;

        var token = settings?.token ?? null;
        if (token && typeof (token) != "string") throw new MalError(`Please provide a valid token: getAnimeRanking({ token: string })`);

        var options
        if (!token) {
            options = {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            }
        } else {
            options = {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        }

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

        var fields = settings?.fields ?? null;
        fields = await this.#checkFields("getSeasonalAnime", "anime", "fields", fields);

        var limit = settings?.limit ?? 10
        await this.#checkParam("getSeasonalAnime", "limit", limit, 1, 500);

        var offset = settings?.offset ?? 0
        await this.#checkParam("getSeasonalAnime", "offset", offset, 0, null);

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }

        const url = `https://api.myanimelist.net/v2/anime/season/${year}/${season}?offset=${offset}&limit=${limit}${fields}${nsfw}`;

        var token = settings?.token ?? null;
        if (token && typeof (token) != "string") throw new MalError(`Please provide a valid token: getSeasonalAnime({ token: string })`);

        var options
        if (!token) {
            options = {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            }
        } else {
            options = {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        }

        const data = await this.#request(url, options);

        return data;
    }

    async getMangaInfo(settings) {
        const availableFields = []

        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) throw new MalError(hasForgetParam.error);

        var manga_name = settings?.name;
        if (!manga_name || typeof manga_name != "string") throw new MalError(`Require name: getMangaInfo({ name: string })`)

        var offset = settings?.offset ?? 0
        await this.#checkParam("getMangaInfo", "offset", offset, 0, null);

        var limit = settings?.limit ?? 10
        await this.#checkParam("getMangaInfo", "limit", limit, 1, 100);

        var fields = settings?.fields ?? null;
        fields = await this.#checkFields("getMangaInfo", "manga", "fields", fields);

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }

        var editedMangaName = manga_name.split(/[:–—]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim()
        if (editedMangaName.split(" ").length > 8) {
            editedMangaName = editedMangaName.split(" ").slice(0, 8).join(" ")
        }

        const url = `https://api.myanimelist.net/v2/manga?q=${encodeURIComponent(editedMangaName)}&offset=${offset}&limit=${limit}${fields}${nsfw}`

        var token = settings?.token ?? null;
        if (token && typeof (token) != "string") throw new MalError(`Please provide a valid token: getMangaInfo({ token: string })`);

        var options
        if (!token) {
            options = {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            }
        } else {
            options = {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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

        var token = settings?.token ?? null;
        if (token && typeof (token) != "string") throw new MalError(`Please provide a valid token: getMangaInfoByURL({ token: string })`);

        var options
        if (!token) {
            options = {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            }
        } else {
            options = {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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

        var token = settings?.token ?? null;
        if (token && typeof (token) != "string") throw new MalError(`Please provide a valid token: getSpecificMangaInfo({ token: string })`);

        var options
        if (!token) {
            options = {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            }
        } else {
            options = {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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

        var token = settings?.token ?? null;
        if (token && typeof (token) != "string") throw new MalError(`Please provide a valid token: getMangaInfoByID({ token: string })`);

        var options
        if (!token) {
            options = {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            }
        } else {
            options = {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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

        var fields = settings?.fields ?? null;
        fields = await this.#checkFields("getMangaRanking", "manga", "fields", fields);

        var limit = settings?.limit ?? 20
        await this.#checkParam("getMangaRanking", "limit", limit, 1, 500);

        var offset = settings?.offset ?? 0
        await this.#checkParam("getMangaRanking", "offset", offset, 0, null);

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }

        const url = `https://api.myanimelist.net/v2/manga/ranking?ranking_type=${ranking_type}${fields}&limit=${limit}&offset=${offset}${nsfw}`

        var token = settings?.token ?? null;
        if (token && typeof (token) != "string") throw new MalError(`Please provide a valid token: getMangaRanking({ token: string })`);

        var options
        if (!token) {
            options = {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            }
        } else {
            options = {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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
        await this.#checkParam("getBoardTopics", "limit", limit, 1, 100);

        var offset = settings?.offset ?? 0
        await this.#checkParam("getBoardTopics", "offset", offset, 0, null);

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
        await this.#checkParam("getTopicDetails", "limit", limit, 1, 100);

        var offset = settings?.offset ?? 0
        await this.#checkParam("getTopicDetails", "offset", offset, 0, null);

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
        if (!refreshToken || typeof (refreshToken) != "string") {
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

    async getUserInformation(settings) {
        const availableFields = ["id", "name", "picture", "gender", "birthday", "location", "joined_at", "anime_statistics", "time_zone", "is_supporter"];

        var token = settings?.token ?? null;
        if (!token || typeof (token) != "string") throw new MalError(`Please provide a valid token: getUserInformation({ token: string })`);

        var fields = settings?.fields ?? null;
        fields = await this.#checkFields("getUserInformation", "user", "fields", fields);

        const url = `https://api.myanimelist.net/v2/users/@me${fields}`;
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }

        const data = await this.#request(url, options);
        return data;
    }

    async getUserAnimeList(settings) {
        const availableStatus = ["watching", "completed", "on_hold", "dropped", "plan_to_watch"];
        const availableSortType = ["list_score", "list_updated_at", "anime_title", "anime_start_date"];

        var username = settings?.username ?? null
        if (username && typeof (username) != "string") throw new MalError(`The "username" field must be a string: getUserAnimeList({ username: string })`);
        if (!username) {
            username = "@me"
        }

        var status = settings?.status ?? null;
        if (status && (typeof (status) != "string" || !availableStatus.includes(status))) throw new MalError(`Please provide a valid status: ${availableStatus.map(e => e).join(', ')}`);
        if (!status) {
            status = ""
        } else {
            status = `&status=${status}`
        }

        var sort = settings?.sort ?? null;
        if (sort && (typeof (sort) != "string" || !availableSortType.includes(sort))) throw new MalError(`Please provide a valid sort type: ${availableSortType.map(e => e).join(', ')}`);
        if (!sort) {
            sort = ""
        } else {
            sort = `&sort=${sort}`
        }

        var limit = settings?.limit ?? 10;
        await this.#checkParam("getUserAnimeList", "limit", limit, 1, 1000);

        var offset = settings?.offset ?? 0;
        await this.#checkParam("getUserAnimeList", "offset", offset, 0, null);

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }

        var fields = settings?.fields ?? null;
        fields = await this.#checkFields("getUserAnimeList", "anime", "fields", fields);

        const url = `https://api.myanimelist.net/v2/users/${username}/animelist?limit=${limit}&offset=${offset}${sort}${status}${fields}${nsfw}`
        var options

        if (username != "@me") {
            options = {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            }
        } else {
            var token = settings?.token ?? null;
            if (!token || typeof (token) != "string") throw new MalError(`When you do not specify the "username" field, you must provide the token of the target user: getUserAnimeList({ token: string })`);

            options = {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        }

        const data = await this.#request(url, options);
        return data;
    }

    async updateUserAnimeList(settings) {
        const availableStatus = ["watching", "completed", "on_hold", "dropped", "plan_to_watch"];

        const formatDate = (date) => {
            if (date instanceof Date && !isNaN(date.getTime())) {
                return date.toISOString().split("T")[0];
            }
            return date;
        }

        const token = settings?.token ?? null;
        if (!token || typeof (token) != "string") throw new MalError(`Please provide a valid token: updateUserAnimeList({ token: string })`);

        const anime_id = settings?.id ?? null;
        if (!anime_id || isNaN(anime_id)) throw new MalError(`Please provide a valid anime id: updateUserAnimeList({ id: number })`);

        const parameters = new URLSearchParams();

        const status = settings?.status ?? null;
        if (status && (typeof (status) != "string" || !availableStatus.includes(status))) throw new MalError(`Please provide a valid status: ${availableStatus.map(e => e).join(', ')}`);
        if (status) parameters.append("status", status)

        const is_rewatching = settings?.is_rewatching ?? null
        if (is_rewatching !== null && typeof (is_rewatching) != "boolean") throw new MalError(`Please provide a valid "is_rewatching" value: updateUserAnimeList({ is_rewatching: boolean })`);
        if (is_rewatching !== null) parameters.append("is_rewatching", is_rewatching);

        let start_date = settings?.start_date ?? null;
        if (start_date !== null) {
            start_date = formatDate(start_date);
            if (typeof (start_date) != "string" || (start_date !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(start_date))) {
                throw new MalError(`Please provide a valid "start_date" (YYYY-MM-DD, empty string, or Date instance): updateUserAnimeList({ start_date: string | Date })`);
            }
            parameters.append("start_date", start_date);
        }

        let end_date = settings?.end_date ?? null;
        if (end_date !== null) {
            end_date = formatDate(end_date);
            if (typeof (end_date) != "string" || (end_date !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(end_date))) {
                throw new MalError(`Please provide a valid "end_date" (YYYY-MM-DD, empty string, or Date instance): updateUserAnimeList({ end_date: string | Date })`);
            }
            parameters.append("end_date", end_date);
        }

        const score = settings?.score ?? null;
        if (score !== null && (isNaN(score) || score < 0 || score > 10)) throw new MalError(`Please provide a score between 0 and 10: updateUserAnimeList({ score: number })`);
        if (score !== null) parameters.append("score", score);

        const num_watched_episodes = settings?.num_watched_episodes ?? null;
        if (num_watched_episodes !== null && (isNaN(num_watched_episodes) || num_watched_episodes < 0)) throw new MalError(`Please provide a valid "num_watched_episodes" value: updateUserAnimeList({ num_watched_episodes: number })`);
        if (num_watched_episodes !== null) parameters.append("num_watched_episodes", num_watched_episodes);

        const priority = settings?.priority ?? null;
        if (priority !== null && (isNaN(priority) || priority < 0 || priority > 2)) throw new MalError(`Please provide a "priority" value between 0 and 2: updateUserAnimeList({ priority: number })`);
        if (priority !== null) parameters.append("priority", priority);

        const num_times_rewatched = settings?.num_times_rewatched ?? null;
        if (num_times_rewatched !== null && (isNaN(num_times_rewatched) || num_times_rewatched < 0)) throw new MalError(`Please provide a valid "num_times_rewatched" value: updateUserAnimeList({ num_times_rewatched: number })`);
        if (num_times_rewatched !== null) parameters.append("num_times_rewatched", num_times_rewatched);

        const rewatch_value = settings?.rewatch_value ?? null;
        if (rewatch_value !== null && (isNaN(rewatch_value) || rewatch_value < 0 || rewatch_value > 5)) throw new MalError(`Please provide a "rewatch_value" value between 0 and 5: updateUserAnimeList({ rewatch_value: number })`);
        if (rewatch_value !== null) parameters.append("rewatch_value", rewatch_value);

        let tags = settings?.tags ?? null;
        if (tags && (!Array.isArray(tags))) throw new MalError(`"tags" must be an array: updateUserAnimeList({ tags: array })`);
        if (tags) {
            parameters.append("tags", tags.join(','));
        }

        const comments = settings?.comments ?? null;
        if (comments !== null && typeof (comments) != "string") throw new MalError(`"comments" must be a string: updateUserAnimeList({ comments: string })`);
        if (comments !== null) parameters.append("comments", comments);

        const url = `https://api.myanimelist.net/v2/anime/${anime_id}/my_list_status`
        const options = {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: parameters.toString()
        }

        await this.#request(url, options);
        return { message: `updated` }
    }

    async deleteUserAnimeList(settings) {
        const token = settings?.token ?? null;
        if (!token || typeof (token) != "string") throw new MalError(`Please provide a valid token: updateUserAnimeList({ token: string })`);

        const anime_id = settings?.id ?? null;
        if (!anime_id || isNaN(anime_id)) throw new MalError(`Please provide a valid anime id: updateUserAnimeList({ id: number })`);

        const url = `https://api.myanimelist.net/v2/anime/${anime_id}/my_list_status`;
        const options = {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }

        await this.#request(url, options);
        return { message: `deleted` }
    }

    async getSuggestedAnime(settings) {
        const token = settings?.token ?? null;
        if (!token || typeof (token) != "string") throw new MalError(`Please provide a valid token: getSuggestedAnime({ token: string })`);

        const limit = settings?.limit ?? 10;
        this.#checkParam("getSuggestedAnime", "limit", limit, 1, 100);

        const offset = settings?.offset ?? 0;
        this.#checkParam("getSuggestedAnime", "offset", offset, 0, null);

        var fields = settings?.fields ?? null;
        fields = await this.#checkFields("getSuggestedAnime", "anime", "fields", fields);

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }

        const url = `https://api.myanimelist.net/v2/anime/suggestions?limit=${limit}&offset=${offset}${fields}${nsfw}`;
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }

        const data = await this.#request(url, options);
        return data
    }

    async getUserMangaList(settings) {
        const availableStatus = ["reading", "completed", "on_hold", "dropped", "plan_to_read"];
        const availableSortType = ["list_score", "list_updated_at", "manga_title", "manga_start_date"];

        var username = settings?.username ?? null
        if (username && typeof (username) != "string") throw new MalError(`The "username" field must be a string: getUserMangaList({ username: string })`);
        if (!username) {
            username = "@me"
        }

        var status = settings?.status ?? null;
        if (status && (typeof (status) != "string" || !availableStatus.includes(status))) throw new MalError(`Please provide a valid status: ${availableStatus.map(e => e).join(', ')}`);
        if (!status) {
            status = ""
        } else {
            status = `&status=${status}`
        }

        var sort = settings?.sort ?? null;
        if (sort && (typeof (sort) != "string" || !availableSortType.includes(sort))) throw new MalError(`Please provide a valid sort type: ${availableSortType.map(e => e).join(', ')}`);
        if (!sort) {
            sort = ""
        } else {
            sort = `&sort=${sort}`
        }

        var fields = settings?.fields ?? null;
        fields = await this.#checkFields("getUserMangaList", "manga", "fields", fields);

        var limit = settings?.limit ?? 10;
        await this.#checkParam("getUserMangaList", "limit", limit, 1, 1000);

        var offset = settings?.offset ?? 0;
        await this.#checkParam("getUserMangaList", "offset", offset, 0, null);

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }

        const url = `https://api.myanimelist.net/v2/users/${username}/mangalist?limit=${limit}&offset=${offset}${sort}${status}${fields}${nsfw}`;
        var options

        if (username != "@me") {
            options = {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            }
        } else {
            var token = settings?.token ?? null;
            if (!token || typeof (token) != "string") throw new MalError(`When you do not specify the "username" field, you must provide the token of the target user: getUserMangaList({ token: string })`);

            options = {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        }

        const data = await this.#request(url, options);
        return data;
    }

    async updateUserMangaList(settings) {
        const availableStatus = ["reading", "completed", "on_hold", "dropped", "plan_to_read"];

        const token = settings?.token ?? null;
        if (!token || typeof (token) != "string") throw new MalError(`Please provide a valid token: updateUserMangaList({ token: string })`);

        const manga_id = settings?.id ?? null;
        if (!manga_id || isNaN(manga_id)) throw new MalError(`Please provide a valid manga id: updateUserMangaList({ id: number })`);

        const parameters = new URLSearchParams();

        const status = settings?.status ?? null;
        if (status && (typeof (status) != "string" || !availableStatus.includes(status))) throw new MalError(`Please provide a valid status: ${availableStatus.map(e => e).join(', ')}`);
        if (status) parameters.append("status", status)

        const is_rereading = settings?.is_rereading ?? null
        if (is_rereading !== null && typeof (is_rereading) != "boolean") throw new MalError(`Please provide a valid "is_rereading" value: updateUserMangaList({ is_rereading: boolean })`);
        if (is_rereading !== null) parameters.append("is_rereading", is_rereading);

        const score = settings?.score ?? null;
        if (score !== null && (isNaN(score) || score < 0 || score > 10)) throw new MalError(`Please provide a score between 0 and 10: updateUserMangaList({ score: number })`);
        if (score !== null) parameters.append("score", score);

        const num_volumes_read = settings?.num_volumes_read ?? null;
        if (num_volumes_read !== null && (isNaN(num_volumes_read) || num_volumes_read < 0)) throw new MalError(`Please provide a valid "num_volumes_read" value: updateUserMangaList({ num_volumes_read: number })`);
        if (num_volumes_read !== null) parameters.append("num_volumes_read", num_volumes_read);

        const num_chapters_read = settings?.num_chapters_read ?? null;
        if (num_chapters_read !== null && (isNaN(num_chapters_read) || num_chapters_read < 0)) throw new MalError(`Please provide a valid "num_chapters_read" value: updateUserMangaList({ num_chapters_read: number })`);
        if (num_chapters_read !== null) parameters.append("num_chapters_read", num_chapters_read);

        const priority = settings?.priority ?? null;
        if (priority !== null && (isNaN(priority) || priority < 0 || priority > 2)) throw new MalError(`Please provide a "priority" value between 0 and 2: updateUserMangaList({ priority: number })`);
        if (priority !== null) parameters.append("priority", priority);

        const num_times_reread = settings?.num_times_reread ?? null;
        if (num_times_reread !== null && (isNaN(num_times_reread) || num_times_reread < 0)) throw new MalError(`Please provide a valid "num_times_reread" value: updateUserMangaList({ num_times_reread: number })`);
        if (num_times_reread !== null) parameters.append("num_times_reread", num_times_reread);

        const reread_value = settings?.reread_value ?? null;
        if (reread_value !== null && (isNaN(reread_value) || reread_value < 0 || reread_value > 5)) throw new MalError(`Please provide a "reread_value" value between 0 and 5: updateUserMangaList({ reread_value: number })`);
        if (reread_value !== null) parameters.append("reread_value", reread_value);

        let tags = settings?.tags ?? null;
        if (tags && (!Array.isArray(tags))) throw new MalError(`"tags" must be an array: updateUserMangaList({ tags: array })`);
        if (tags) {
            parameters.append("tags", tags.join(','));
        }

        const comments = settings?.comments ?? null;
        if (comments !== null && typeof (comments) != "string") throw new MalError(`"comments" must be a string: updateUserMangaList({ comments: string })`);
        if (comments !== null) parameters.append("comments", comments);

        const url = `https://api.myanimelist.net/v2/manga/${manga_id}/my_list_status`
        const options = {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: parameters.toString()
        }

        await this.#request(url, options);
        return { message: `updated` }
    }

    async deleteUserMangaList(settings) {
        const token = settings?.token ?? null;
        if (!token || typeof (token) != "string") throw new MalError(`Please provide a valid token: deleteUserMangaList({ token: string })`);

        const manga_id = settings?.id ?? null;
        if (!manga_id || isNaN(manga_id)) throw new MalError(`Please provide a valid manga id: deleteUserMangaList({ manga_id: number })`);

        const url = `https://api.myanimelist.net/v2/manga/${manga_id}/my_list_status`;
        const options = {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }

        await this.#request(url, options);
        return { message: `Manga (${manga_id}) deleted.` }
    }
}

module.exports = {
    MyAnimeList,
    MalError
}