export interface MALOptions {
    client_id?:string;
};

export type CommonField =
    | "id"
    | "title"
    | "main_picture"
    | "alternative_titles"
    | "start_date"
    | "end_date"
    | "synopsis"
    | "mean"
    | "rank"
    | "popularity"
    | "num_list_users"
    | "num_scoring_users"
    | "nsfw"
    | "genres"
    | "created_at"
    | "updated_at"
    | "media_type"
    | "status";

export type AnimeSpecificField =
    | "num_episodes"
    | "start_season"
    | "broadcast"
    | "source"
    | "average_episode_duration"
    | "rating"
    | "studios";

export type MangaSpecificField =
    | "num_volumes"
    | "num_chapters"
    | "authors";

export type AnimeRankingType =
    | "all"
    | "airing"
    | "upcoming"
    | "tv"
    | "ova"
    | "movie"
    | "special"
    | "bypopularity"
    | "favorite";

export type MangaRankingType =
    | "all"
    | "manga"
    | "novels"
    | "oneshots"
    | "doujin"
    | "manhwa"
    | "manhua"
    | "bypopularity"
    | "favorite";

export type MALSeasons =
    | "winter"
    | "spring"
    | "summer"
    | "fall";

export type BoardCategory =
    | "MyAnimeList"
    | "Anime & Manga"
    | "General"
    | "Archive";

export type AnimeField = CommonField | AnimeSpecificField;
export type MangaField = CommonField | MangaSpecificField;

export interface AnimeInfoOptions {
    name: string;
    offset?: number;
    limit?: number;
    fields?: AnimeField[];
    nsfw?: boolean;
};

export interface AnimeInfoURLOptions {
    api_url: string;
};

export interface SpecificAnimeInfoOptions {
    name: string;
    fields?: AnimeField[];
    nsfw?: boolean;
};

export interface AnimeInfoByIDOptions {
    id: number;
    fields?: AnimeField[];
    nsfw?: boolean;
};

export interface AnimeRankingOptions {
    type?: AnimeRankingType;
    fields?: AnimeField[];
    limit?: number;
    offset?: number;
    nsfw?: boolean;
};

export interface SeasonalAnimeOptions {
    season?: MALSeasons;
    year?: number;
    fields?: AnimeField[];
    limit?: number;
    offset?: number;
    nsfw?: boolean;
};

export interface MangaInfoOptions {
    name: string;
    offset?: number;
    limit?: number;
    fields?: MangaField[];
    nsfw?: boolean;
};

export interface MangaInfoURLOptions {
    api_url: string;
};

export interface SpecificMangaInfoOptions {
    name: string;
    fields?: MangaField[];
    nsfw?: boolean;
};

export interface MangaInfoByIDOptions {
    id: number;
    fields?: MangaField[];
    nsfw?: boolean;
};

export interface MangaRankingOptions {
    type?: MangaRankingType;
    fields?: MangaField[];
    limit?: number;
    offset?: number;
    nsfw?: boolean;
};

export interface AllBoardsOptions {
    categories?: BoardCategory[];
};

export interface BoardTopicsOptions {
    search?: string;
    board_id?: number;
    subboard_id?: number;
    username?: string;
    topic_username?: string;
    limit?: number;
    offset?: number;
};

export interface BoardTopicsURLOptions {
    api_url: string;
};

export interface TopicDetailsOptions {
    topic_id: number;
    limit?: number;
    offset?: number;
};

export interface TopicDetailsURLOptions {
    api_url: string;
};

export class MyAnimeList {
    constructor(options: MALOptions);

    getAnimeInfo(
        options: AnimeInfoOptions
    ): Promise<any>;

    getAnimeInfoByURL(
        options:AnimeInfoURLOptions
    ): Promise<any>;

    getSpecificAnimeInfo(
        options: SpecificAnimeInfoOptions
    ): Promise<any>;

    getAnimeInfoByID(
        options: AnimeInfoByIDOptions
    ): Promise<any>;

    getAnimeRanking(
        options?: AnimeRankingOptions
    ): Promise<any>;

    getSeasonalAnime(
        options?: SeasonalAnimeOptions
    ): Promise<any>;

    getMangaInfo(
        options: MangaInfoOptions
    ): Promise<any>;

    getMangaInfoByURL(
        options: MangaInfoURLOptions
    ): Promise<any>;

    getSpecificMangaInfo(
        options: SpecificMangaInfoOptions
    ): Promise<any>;

    getMangaInfoByID(
        options: MangaInfoByIDOptions
    ): Promise<any>;

    getMangaRanking(
        options?: MangaRankingOptions
    ): Promise<any>;

    getAllBoards(
        options?: AllBoardsOptions
    ): Promise<any>;

    getBoardTopics(
        options?: BoardTopicsOptions
    ): Promise<any>;

    getBoardTopicsByURL(
        options: BoardTopicsURLOptions
    ): Promise<any>;

    getTopicDetails(
        options: TopicDetailsOptions
    ): Promise<any>;

    getTopicDetailsByURL(
        options: TopicDetailsURLOptions
    ): Promise<any>;
}