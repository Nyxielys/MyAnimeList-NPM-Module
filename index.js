class MyAnimeList {
    constructor(datas) {
        this.client_id = datas.client_id;
        this.client_secret = datas.client_secret;
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
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) {
            return {
                success: false,
                error: hasForgetParam.error
            }
        }

        var anime_name = settings?.name

        var offset = settings?.offset ?? ''
        if (offset != '' && isNaN(offset)) return { success: false, error: `The "offset" field must be a valid positive number.` }
        if (offset != '') offset = `&offset=${offset}`

        var limit = settings?.limit ?? ''
        if (limit != '' && isNaN(limit)) return { success: false, error: `The "limit" field must be a valid positive number (<=500).` }
        if (limit != '' && limit > 500) return { success: false, error: `The "limit" field must be a valid positive number (<=500).` }
        if (limit != '') limit = `&limit=${limit}`

        var fields = settings?.fields ?? []
        if (fields.length > 0) fields = `&fields=${fields.map(field => field).join(',')}`

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }

        if (!anime_name) {
            return {
                success: false,
                error: `Require name: getAnimeInfo({ name: string })`
            }
        }

        var editedAnimeName = anime_name.split(/[:–—]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim()
        if (editedAnimeName.split(" ").length > 8) {
            editedAnimeName = editedAnimeName.split(" ").slice(0, 8).join(" ")
        }

        const url = `https://api.myanimelist.net/v2/anime?q=${encodeURIComponent(editedAnimeName)}${offset}${limit}${fields}${nsfw}`
        var data

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            })

            if (!response.ok) {
                return {
                    success: false,
                    error: `API Error: ${response.status}`
                }
            }
            data = await response.json()
        } catch (err) {
            return {
                success: false,
                error: err
            }
        }

        return {
            success: true,
            datas: data
        }
    }

    async getAnimeInfoByURL(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) {
            return {
                success: false,
                error: hasForgetParam.error
            }
        }

        var url = settings?.api_url
        if (!url) {
            return {
                success: false,
                error: `Require api_url: getAnimeInfoByURL({ api_url: string })`
            }
        }

        if (!url.includes('api.myanimelist.net/v2/anime')) {
            return {
                success: false,
                error: `Invalid URL.`
            }
        }

        var data
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            })

            if (!response.ok) {
                return {
                    success: false,
                    error: `API Error: ${response.status}`
                }
            }

            data = await response.json()
        } catch (err) {
            return {
                success: false,
                error: err
            }
        }

        return {
            success: true,
            datas: data
        }
    }

    async getSpecificAnimeInfo(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) {
            return {
                success: false,
                error: hasForgetParam.error
            }
        }

        var anime_name = settings?.name

        var fields = settings?.fields ?? []
        if (!Array.isArray(fields)) return { success: false, error: `The "fields" field must be a list: getSpecificAnimeInfo({ fields: [array] })` }
        await fields.push("alternative_titles")
        if (fields.length > 0) fields = `&fields=${fields.map(field => field).join(',')}`

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }

        if (!anime_name) {
            return {
                success: false,
                error: `Require name: getSpecificAnimeInfo({ name: string })`
            }
        }

        var editedAnimeName = anime_name.split(/[:–—-]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim()
        if (editedAnimeName.split(" ").length > 8) {
            editedAnimeName = editedAnimeName.split(" ").slice(0, 8).join(" ")
        }

        const url = `https://api.myanimelist.net/v2/anime?q=${encodeURIComponent(editedAnimeName)}${fields}${nsfw}`
        var data

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            })

            if (!response.ok) {
                return {
                    success: false,
                    error: `API Error: ${response.status}`
                }
            }
            data = await response.json()

        } catch (err) {
            return {
                success: false,
                error: err
            }
        }

        try {
            var datas = data.data
            const animeInfos = datas.find(anime => {
                const anime_datas = anime.node

                const title = anime_datas.title?.toLowerCase() || ""
                var editedTitle = title.split(/[:–—-]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim()

                const enTitle = anime_datas.alternative_titles?.en.toLowerCase() || ""
                var editedEnTitle = enTitle.split(/[:–—-]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim()

                const synonyms = anime_datas.alternative_titles?.synonyms || []
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
            return {
                success: true,
                datas: data
            }
        }

        return {
            success: true,
            datas: data
        }
    }

    async getAnimeInfoByID(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) {
            return {
                success: false,
                error: hasForgetParam.error
            }
        }

        var anime_id = settings?.id
        if (isNaN(anime_id)) return { success: false, error: `The "id" field must be a valid positive number.` }

        var fields = settings?.fields ?? []
        if (!Array.isArray(fields)) return { success: false, error: `The "fields" field must be a list: getAnimeInfoByID({ fields: [array] })` }
        if (fields.length > 0) fields = `&fields=${fields.map(field => field).join(',')}`

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `?nsfw=true` } else { nsfw = `?nsfw=false` }

        if (!anime_id) {
            return {
                success: false,
                error: `Require id (number >0): getAnimeInfoByID({ id: number })`
            }
        }

        const url = `https://api.myanimelist.net/v2/anime/${anime_id}${nsfw}${fields}`
        var data

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            })

            if (!response.ok) {
                return {
                    success: false,
                    error: `API Error: ${response.status}`
                }
            }

            data = await response.json()
        } catch (err) {
            return {
                success: false,
                error: err
            }
        }

        return {
            success: true,
            datas: data
        }
    }

    async getAnimeRanking(settings) {
        const available_ranking_type = ["all", "airing", "upcoming", "tv", "ova", "movie", "special", "bypopularity", "favorite"]

        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) {
            return {
                success: false,
                error: hasForgetParam.error
            }
        }

        var ranking_type = settings?.type ?? "all"
        if (!available_ranking_type.includes(ranking_type)) return { success: false, error: `Please use a valid ranking type: ${available_ranking_type.map(f => f).join(', ')}` }

        var fields = settings?.fields ?? []
        if (!Array.isArray(fields)) return { success: false, error: `The "fields" field must be a list: getAnimeRanking({ fields: [array] })` }
        if (fields.length > 0) fields = `&fields=${fields.map(field => field).join(',')}`

        var limit = settings?.limit ?? ''
        if (limit != '' && isNaN(limit)) return { success: false, error: `The "limit" field must be a valid positive number (<=500).` }
        if (limit != '' && limit > 500) return { success: false, error: `The "limit" field must be a valid positive number (<=500).` }
        if (limit != '') limit = `&limit=${limit}`

        var offset = settings?.offset ?? ''
        if (offset != '' && isNaN(offset) && limit.toString() != '0') return { success: false, error: `The "offset" field must be a valid positive number.` }
        if (offset != '') offset = `&offset=${offset}`

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }

        const url = `https://api.myanimelist.net/v2/anime/ranking?ranking_type=${ranking_type}${fields}${limit}${offset}${nsfw}`
        var data
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            })

            if (!response.ok) {
                return {
                    success: false,
                    error: `API Error: ${response.status}`
                }
            }

            data = await response.json()
        } catch (err) {
            return {
                success: false,
                error: err
            }
        }

        return {
            success: true,
            datas: data
        }
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
        if (hasForgetParam.error) {
            return {
                success: false,
                error: hasForgetParam.error
            }
        }

        var season = settings?.season ?? await getSeason()
        if (!seasonsList.includes(season)) return { success: false, error: `Please use a valid season: ${seasonsList.map(f => f).join(', ')}` }

        var year = settings?.year ?? await getYear()
        if (isNaN(year)) return { success: false, error: `The "year" field must be a valid positive number.` }

        var fields = settings?.fields ?? []
        if (!Array.isArray(fields)) return { success: false, error: `The "fields" field must be a list: getAnimeRanking({ fields: [array] })` }
        if (fields.length > 0) fields = `&fields=${fields.map(field => field).join(',')}`

        var limit = settings?.limit ?? ''
        if (limit != '' && isNaN(limit)) return { success: false, error: `The "limit" field must be a valid positive number (<=500).` }
        if (limit != '' && limit > 500) return { success: false, error: `The "limit" field must be a valid positive number (<=500).` }
        if (limit != '') limit = `&limit=${limit}`

        var offset = settings?.offset ?? 0
        if (offset != '' && isNaN(offset) && limit.toString() != '0') return { success: false, error: `The "offset" field must be a valid positive number.` }

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }

        const url = `https://api.myanimelist.net/v2/anime/season/${year}/${season}?offset=${offset}${limit}${fields}${nsfw}`
        var data

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            })

            if (!response.ok) {
                return {
                    success: false,
                    error: `API Error: ${response.status}`
                }
            }

            data = await response.json()
        } catch (err) {
            return {
                success: false,
                error: err
            }
        }

        return {
            success: true,
            datas: data
        }
    }

    async getMangaInfo(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) {
            return {
                success: false,
                error: hasForgetParam.error
            }
        }

        var manga_name = settings?.name

        var offset = settings?.offset ?? ''
        if (offset != '' && isNaN(offset)) return { success: false, error: `The "offset" field must be a valid positive number.` }
        if (offset != '') offset = `&offset=${offset}`

        var limit = settings?.limit ?? ''
        if (limit != '' && isNaN(limit)) return { success: false, error: `The "limit" field must be a valid positive number (<=500).` }
        if (limit != '' && limit > 500) return { success: false, error: `The "limit" field must be a valid positive number (<=500).` }
        if (limit != '') limit = `&limit=${limit}`

        var fields = settings?.fields ?? []
        if (fields.length > 0) fields = `&fields=${fields.map(field => field).join(',')}`

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }

        if (!manga_name) {
            return {
                success: false,
                error: `Require name: getMangaInfo({ name: string })`
            }
        }

        var editedMangaName = manga_name.split(/[:–—]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim()
        if (editedMangaName.split(" ").length > 8) {
            editedMangaName = editedMangaName.split(" ").slice(0, 8).join(" ")
        }

        const url = `https://api.myanimelist.net/v2/manga?q=${encodeURIComponent(editedMangaName)}${offset}${limit}${fields}${nsfw}`
        var data

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            })

            if (!response.ok) {
                return {
                    success: false,
                    error: `API Error: ${response.status}`
                }
            }
            data = await response.json()
        } catch (err) {
            return {
                success: false,
                error: err
            }
        }

        return {
            success: true,
            datas: data
        }
    }

    async getMangaInfoByURL(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) {
            return {
                success: false,
                error: hasForgetParam.error
            }
        }

        var url = settings?.api_url
        if (!url) {
            return {
                success: false,
                error: `Require api_url: getMangaInfoByURL({ api_url: string })`
            }
        }

        if (!url.includes('api.myanimelist.net/v2/manga')) {
            return {
                success: false,
                error: `Invalid URL.`
            }
        }

        var data
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            })

            if (!response.ok) {
                return {
                    success: false,
                    error: `API Error: ${response.status}`
                }
            }

            data = await response.json()
        } catch (err) {
            return {
                success: false,
                error: err
            }
        }

        return {
            success: true,
            datas: data
        }
    }

    async getSpecificMangaInfo(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) {
            return {
                success: false,
                error: hasForgetParam.error
            }
        }

        var manga_name = settings?.name

        var fields = settings?.fields ?? []
        if (!Array.isArray(fields)) return { success: false, error: `The "fields" field must be a list: getSpecificMangaInfo({ fields: [array] })` }
        await fields.push("alternative_titles")
        if (fields.length > 0) fields = `&fields=${fields.map(field => field).join(',')}`

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }

        if (!manga_name) {
            return {
                success: false,
                error: `Require name: getSpecificMangaInfo({ name: string })`
            }
        }

        var editedMangaName = manga_name.split(/[:–—-]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim()
        if (editedMangaName.split(" ").length > 8) {
            editedMangaName = editedMangaName.split(" ").slice(0, 8).join(" ")
        }

        const url = `https://api.myanimelist.net/v2/manga?q=${encodeURIComponent(editedMangaName)}${fields}${nsfw}`
        var data

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            })

            if (!response.ok) {
                return {
                    success: false,
                    error: `API Error: ${response.status}`
                }
            }
            data = await response.json()
        } catch (err) {
            return {
                success: false,
                error: err
            }
        }

        try {
            var datas = data.data
            const mangaInfos = datas.find(manga => {
                const manga_datas = manga.node

                const title = manga_datas.title?.toLowerCase() || ""
                var editedTitle = title.split(/[:–—-]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim()

                const enTitle = manga_datas.alternative_titles?.en.toLowerCase() || ""
                var editedEnTitle = enTitle.split(/[:–—-]/)[0].replace(/[^a-zA-Z0-9\s]/g, "").trim()

                const synonyms = manga_datas.alternative_titles?.synonyms || []
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
            return {
                success: true,
                datas: data
            }
        }

        return {
            success: true,
            datas: data
        }
    }

    async getMangaInfoByID(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) {
            return {
                success: false,
                error: hasForgetParam.error
            }
        }

        var manga_id = settings?.id
        if (isNaN(manga_id)) return { success: false, error: `The "id" field must be a valid positive number.` }

        var fields = settings?.fields ?? []
        if (!Array.isArray(fields)) return { success: false, error: `The "fields" field must be a list: getMangaInfoByID({ fields: [array] })` }
        if (fields.length > 0) fields = `&fields=${fields.map(field => field).join(',')}`

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `?nsfw=true` } else { nsfw = `?nsfw=false` }

        if (!manga_id) {
            return {
                success: false,
                error: `Require id (number >0): getMangaInfoByID({ id: number })`
            }
        }

        const url = `https://api.myanimelist.net/v2/manga/${manga_id}${nsfw}${fields}`
        var data

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            })

            if (!response.ok) {
                return {
                    success: false,
                    error: `API Error: ${response.status}`
                }
            }

            data = await response.json()
        } catch (err) {
            return {
                success: false,
                error: err
            }
        }

        return {
            success: true,
            datas: data
        }
    }

    async getMangaRanking(settings) {
        const available_ranking_type = ["all", "manga", "novels", "oneshots", "doujin", "manhwa", "manhua", "bypopularity", "favorite"]

        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) {
            return {
                success: false,
                error: hasForgetParam.error
            }
        }

        var ranking_type = settings?.type ?? "all"
        if (!available_ranking_type.includes(ranking_type)) return { success: false, error: `Please use a valid ranking type: ${available_ranking_type.map(f => f).join(', ')}` }

        var fields = settings?.fields ?? []
        if (!Array.isArray(fields)) return { success: false, error: `The "fields" field must be a list: getMangaRanking({ fields: [array] })` }
        if (fields.length > 0) fields = `&fields=${fields.map(field => field).join(',')}`

        var limit = settings?.limit ?? ''
        if (limit != '' && isNaN(limit)) return { success: false, error: `The "limit" field must be a valid positive number (<=500).` }
        if (limit != '' && limit > 500) return { success: false, error: `The "limit" field must be a valid positive number (<=500).` }
        if (limit != '') limit = `&limit=${limit}`

        var offset = settings?.offset ?? ''
        if (offset != '' && isNaN(offset) && limit.toString() != '0') return { success: false, error: `The "offset" field must be a valid positive number.` }
        if (offset != '') offset = `&offset=${offset}`

        var nsfw = settings?.nsfw ?? false
        if (nsfw === true) { nsfw = `&nsfw=true` } else { nsfw = `&nsfw=false` }

        const url = `https://api.myanimelist.net/v2/manga/ranking?ranking_type=${ranking_type}${fields}${limit}${offset}${nsfw}`
        var data
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-MAL-CLIENT-ID': this.client_id
                }
            })

            if (!response.ok) {
                return {
                    success: false,
                    error: `API Error: ${response.status}`
                }
            }

            data = await response.json()
        } catch (err) {
            return {
                success: false,
                error: err
            }
        }

        return {
            success: true,
            datas: data
        }
    }

    async getAllBoards(settings) {
        const validCategories = ["MyAnimeList", "Anime & Manga", "General", "Archive"];

        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) {
            return {
                success: false,
                error: hasForgetParam.error
            }
        }

        var selectedCategory = settings?.categories
        if (selectedCategory && selectedCategory?.length > 0) {
            if (typeof (selectedCategory) != "object") {
                return {
                    success: false,
                    error: 'The "categories" field must be a list: getAllBoards({ categories: array })'
                }
            }

            for (let i = 0; i < selectedCategory?.length; i++) {
                if (!validCategories.includes(selectedCategory[i])) {
                    return {
                        success: false,
                        error: `Please use valid categories: ${validCategories.map(c => c).join(', ')}`
                    }
                }
            }
        }

        const response = await fetch('https://api.myanimelist.net/v2/forum/boards', {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': this.client_id
            }
        })

        const DATA = await response.json();
        var requestedDatas = []

        if (!response.ok) {
            return {
                success: false,
                error: `API Error: ${response.status}`
            }
        }

        if (selectedCategory && selectedCategory?.length > 0) {
            for (let i = 0; i < DATA.categories.length; i++) {
                if (selectedCategory.includes(DATA.categories[i].title)) {
                    requestedDatas.push(DATA.categories[i])
                }
            }
        } else {
            requestedDatas = DATA.categories
        }

        return {
            success: true,
            datas: requestedDatas
        }

    }

    async getBoardTopics(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) {
            return {
                success: false,
                error: hasForgetParam.error
            }
        }

        var boardId = settings?.board_id ?? null
        if (boardId && isNaN(boardId)) {
            return {
                success: false,
                error: `The "board_id" field must be a number: getBoardTopics({ board_id: number })`
            }
        }
        if (boardId) boardId = `&board_id=${boardId}`
        else boardId = ""

        var subboard_id = settings?.subboard_id ?? null
        if (subboard_id && isNaN(subboard_id)) {
            return {
                success: false,
                error: `The "subboard_id" field must be a number: getBoardTopics({ subboard_id: number })`
            }
        }
        if (subboard_id) subboard_id = `&subboard_id=${subboard_id}`
        else subboard_id = ""

        var limit = settings?.limit ?? 10
        if (isNaN(limit) || limit > 100) {
            return {
                success: false,
                error: `The "limit" field must be a number: getBoardTopics({ limit: number (must be <= 100) })`
            }
        }

        var offset = settings?.offset ?? 0
        if (isNaN(offset)) {
            return {
                success: false,
                error: `The "offset" field must be a number: getBoardTopics({ offset: number })`
            }
        }

        var search = settings?.search ?? null
        if (search && typeof (search) != "string") {
            return {
                success: false,
                error: `The "search" field must be a string: getBoardTopics({ search: string })`
            }
        }

        if (search) search = `&q=${encodeURIComponent(search)}`
        else search = ""

        var topic_username = settings?.topic_username ?? null
        if (topic_username && typeof (topic_username) != "string") {
            return {
                success: false,
                error: `The "topic_username" field must be a string: getBoardTopics({ topic_username: string })`
            }
        }

        if (topic_username) topic_username = `&topic_user_name=${encodeURIComponent(topic_username)}`
        else topic_username = ""

        var username = settings?.username ?? null
        if (username && typeof (username) != "string") {
            return {
                success: false,
                error: `The "username" field must be a string: getBoardTopics({ username: string })`
            }
        }

        if (username) username = `&user_name=${encodeURIComponent(username)}`
        else username = ""

        if (boardId === "" && subboard_id === "" && search === "" & topic_username === "" && username === "") {
            return {
                success: false,
                error: `Please define at least one search parameter from the following: board_id, subboard_id, search, topic_username, username`
            }
        }

        const response = await fetch(`https://api.myanimelist.net/v2/forum/topics?limit=${limit}&offset=${offset}${boardId}${subboard_id}${search}${topic_username}${username}`, {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': this.client_id
            }
        })

        const DATA = await response.json();
        if (!response.ok) {
            return {
                success: false,
                error: `API Error: ${response.status}`
            }
        }

        return {
            success: true,
            datas: DATA
        }

    }

    async getBoardTopicsByURL(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) {
            return {
                success: false,
                error: hasForgetParam.error
            }
        }

        const url = settings?.api_url ?? null;
        if (!url) {
            return {
                success: false,
                error: `Require api_url: getBoardTopicsByURL({ api_url: string })`
            }
        }

        if (!url.includes('api.myanimelist.net/v2/forum/topics')) {
            return {
                success: false,
                error: "Invalid URL."
            }
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': this.client_id
            }
        })
        const DATA = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: `API Error: ${response.status}`
            }
        }

        return {
            success: true,
            datas: DATA
        }
    }

    async getTopicDetails(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) {
            return {
                success: false,
                error: hasForgetParam.error
            }
        }

        const topicID = settings?.topic_id ?? null;
        if (!topicID || isNaN(topicID)) {
            return {
                success: false,
                error: "Please provide the topic ID: getTopicDetails({ topic_id: number })"
            }
        }

        var limit = settings?.limit ?? 10
        if (isNaN(limit) || limit > 100) {
            return {
                success: false,
                error: `The "limit" field must be a number: getTopicDetails({ limit: number (must be <= 100) })`
            }
        }

        var offset = settings?.offset ?? 0
        if (isNaN(offset)) {
            return {
                success: false,
                error: `The "offset" field must be a number: getTopicDetails({ offset: number })`
            }
        }

        const response = await fetch(`https://api.myanimelist.net/v2/forum/topic/${topicID}?limit=${limit}&offset=${offset}`, {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': this.client_id
            }
        })
        const DATA = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: `API Error: ${response.status}`
            }
        }

        return {
            success: true,
            datas: DATA
        }
    }

    async getTopicDetailsByURL(settings) {
        const hasForgetParam = await this.#checkIfHasParams('only_client_id')
        if (hasForgetParam.error) {
            return {
                success: false,
                error: hasForgetParam.error
            }
        }

        const url = settings?.api_url ?? null;
        if (!url) {
            return {
                success: false,
                error: `Require api_url: getTopicDetailsByURL({ api_url: string })`
            }
        }

        if (!url.includes('api.myanimelist.net/v2/forum/topic/')) {
            return {
                success: false,
                error: "Invalid URL."
            }
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': this.client_id
            }
        })
        const DATA = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: `API Error: ${response.status}`
            }
        }

        return {
            success: true,
            datas: DATA
        }
    }

}

module.exports = {
    MyAnimeList
}