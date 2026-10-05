export interface MALOptions {
    client_id?:string;
    token?: string;
}

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
    | "my_list_status"
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

export type UserSpecificField =
    | "id"
    | "name"
    | "picture"
    | "gender"
    | "birthday"
    | "location"
    | "joined_at"
    | "anime_statistics"
    | "time_zone"
    | "is_supporter";

export type AnimeListStatus =
    | "watching"
    | "completed"
    | "on_hold"
    | "dropped"
    | "plan_to_watch";

export type AnimeListSort =
    | "list_score"
    | "list_updated_at"
    | "anime_title"
    | "anime_start_date"

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

export type MangaListStatus =
    | "reading"
    | "completed"
    | "on_hold"
    | "dropped"
    | "plan_to_read";

export type MangaListSort =
    | "list_score"
    | "list_updated_at"
    | "manga_title"
    | "manga_start_date";

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
export type GetAnimeListField = AnimeField | "list_status";
export type GetMangaListField = MangaField | "list_status";

export interface AnimeInfoOptions {
    name: string;
    token?: string;
    offset?: number;
    limit?: number;
    fields?: AnimeField[];
    nsfw?: boolean;
}

export interface AnimeInfoURLOptions {
    api_url: string;
    token?: string;
}

export interface SpecificAnimeInfoOptions {
    name: string;
    fields?: AnimeField[];
    nsfw?: boolean;
    token?: string;
}

export interface AnimeInfoByIDOptions {
    id: number;
    token?: string;
    fields?: AnimeField[];
    nsfw?: boolean;
}

export interface AnimeRankingOptions {
    type?: AnimeRankingType;
    token?: string;
    fields?: AnimeField[];
    limit?: number;
    offset?: number;
    nsfw?: boolean;
}

export interface SeasonalAnimeOptions {
    token?: string;
    season?: MALSeasons;
    year?: number;
    fields?: AnimeField[];
    limit?: number;
    offset?: number;
    nsfw?: boolean;
}

export interface MangaInfoOptions {
    name: string;
    token?: string;
    offset?: number;
    limit?: number;
    fields?: MangaField[];
    nsfw?: boolean;
}

export interface MangaInfoURLOptions {
    api_url: string;
    token?: string;
}

export interface SpecificMangaInfoOptions {
    name: string;
    token?: string;
    fields?: MangaField[];
    nsfw?: boolean;
}

export interface MangaInfoByIDOptions {
    id: number;
    token?: string;
    fields?: MangaField[];
    nsfw?: boolean;
}

export interface MangaRankingOptions {
    type?: MangaRankingType;
    token?: string;
    fields?: MangaField[];
    limit?: number;
    offset?: number;
    nsfw?: boolean;
}

export interface AllBoardsOptions {
    categories?: BoardCategory[];
}

export interface BoardTopicsOptions {
    search?: string;
    board_id?: number;
    subboard_id?: number;
    username?: string;
    topic_username?: string;
    limit?: number;
    offset?: number;
}

export interface BoardTopicsURLOptions {
    api_url: string;
}

export interface TopicDetailsOptions {
    topic_id: number;
    limit?: number;
    offset?: number;
}

export interface TopicDetailsURLOptions {
    api_url: string;
}

export interface PkceCodesReturn {
    verifier: string;
    challenge: string;
}

export interface GenerateAuthURLOptions {
    challenge: string;
    redirect_uri: string;
}

export interface AuthorizeOptions {
    code: string;
    verifier: string;
    redirect_uri: string;
}

export interface RefreshTokenOptions {
    refresh_token: string;
}

export interface GetUserInformationOptions {
    token: string;
    fields?: UserSpecificField[];
}

export interface GetUserAnimeListOptions {
    username?: string;
    token?: string;
    status?: AnimeListStatus;
    sort?: AnimeListSort;
    fields?: GetAnimeListField[];
    limit?: number;
    offset?: number;
    nsfw?: boolean;
}

export interface GetUserAnimeListURLOptions {
    api_url: string;
    token?: string;
}

export interface UpdateUserAnimeListOptions {
    token: string;
    anime_id: number;
    status?: AnimeListStatus;
    is_rewatching?: boolean;
    start_date?: string | Date;
    end_date?: string | Date;
    score?: number;
    num_watched_episodes?: number;
    priority?: number;
    num_times_rewatched?: number;
    rewatch_value?: number;
    tags?: string[];
    comments?: string;
}

export interface DeleteUserAnimeListOptions {
    token: string;
    anime_id: number;
}

export interface GetSuggestedAnimeOptions {
    token: string;
    limit?: number;
    offset?: number;
    fields?: AnimeField[];
    nsfw?: boolean;
}

export interface GetSuggestedAnimeURLOptions {
    api_url: string;
    token: string;
}

export interface GetUserMangaListOptions {
    username?: string;
    token?: string;
    status?: MangaListStatus;
    sort?: MangaListSort;
    fields?: GetMangaListField[];
    limit?: number;
    offset?: number;
    nsfw: boolean;
}

export interface GetUserMangaListURLOptions {
    api_url: string;
    token?: string;
}

export interface UpdateUserMangaListOptions {
    token: string;
    manga_id: number;
    status?: MangaListStatus;
    is_rereading?: boolean;
    score?: number;
    num_volumes_read?: number;
    num_chapters_read?: number;
    priority?: number;
    num_times_reread?: number;
    reread_value?: number;
    tags?: string[];
    comments?: string;
}

export interface DeleteUserMangaListOptions {
    token: string;
    manga_id: string;
}

export class MalError extends Error {
    status: number | null;
    details: any;

    constructor(message: string, status?: number | null, details?: any);
}

export class MyAnimeList {
    constructor(options: MALOptions);

    getAnimeInfo(options: AnimeInfoOptions): Promise<any>;

    getAnimeInfoByURL(options:AnimeInfoURLOptions): Promise<any>;

    getSpecificAnimeInfo(options: SpecificAnimeInfoOptions): Promise<any>;

    getAnimeInfoByID(options: AnimeInfoByIDOptions): Promise<any>;

    getAnimeRanking(options?: AnimeRankingOptions): Promise<any>;

    getSeasonalAnime(options?: SeasonalAnimeOptions): Promise<any>;

    getMangaInfo(options: MangaInfoOptions): Promise<any>;

    getMangaInfoByURL(options: MangaInfoURLOptions): Promise<any>;

    getSpecificMangaInfo(options: SpecificMangaInfoOptions): Promise<any>;

    getMangaInfoByID(options: MangaInfoByIDOptions): Promise<any>;

    getMangaRanking(options?: MangaRankingOptions): Promise<any>;

    getAllBoards(options?: AllBoardsOptions): Promise<any>;

    getBoardTopics(options?: BoardTopicsOptions): Promise<any>;

    getBoardTopicsByURL(options: BoardTopicsURLOptions): Promise<any>;

    getTopicDetails(options: TopicDetailsOptions): Promise<any>;

    getTopicDetailsByURL(options: TopicDetailsURLOptions): Promise<any>;

    generatePKCE(): Promise<PkceCodesReturn>;

    generateAuthURL(options: GenerateAuthURLOptions): Promise<any>;

    authorize(options: AuthorizeOptions): Promise<any>;

    refreshToken(options: RefreshTokenOptions): Promise<any>;

    getUserInformation(options: GetUserInformationOptions): Promise<any>;

    getUserAnimeList(options: GetUserAnimeListOptions): Promise<any>;

    getUserAnimeListByURL(options: GetUserAnimeListURLOptions): Promise<any>;

    updateUserAnimeList(options: UpdateUserAnimeListOptions): Promise<any>;

    deleteUserAnimeList(options: DeleteUserAnimeListOptions): Promise<any>;

    getSuggestedAnime(options: GetSuggestedAnimeOptions): Promise<any>;

    getSuggestedAnimeByURL(options: GetSuggestedAnimeURLOptions): Promise<any>;

    getUserMangaList(options: GetUserMangaListOptions): Promise<any>;

    getUserMangaListByURL(options: GetUserMangaListURLOptions): Promise<any>;

    updateUserMangaList(options: UpdateUserMangaListOptions): Promise<any>;

    deleteUserMangaList(options: DeleteUserMangaListOptions): Promise<any>;
}