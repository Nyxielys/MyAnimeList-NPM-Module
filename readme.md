
# MyAnimeList Module 
This module is neither affiliated with nor endorsed by MyAnimeList.
All data returned by this module is provided by MyAnimeList.

[![version badge](https://img.shields.io/badge/Version-1.0.0-light_green)](https://img.shields.io/badge/Version-1.0.0-light_green)

## Installation

Install myanimelist-module with npm

```bash
  npm install myanimelist-module
```
    
## Usage/Examples

```javascript
const { MyAnimeList } = require('myanimelist-module')
const mal = new MyAnimeList({
    client_id: `YOUR_MAL_CLIENT_ID`
})

async function test() {
    const response = await mal.getAnimeInfo({
        name: "Anime name"
    })
    if(response.error) {
        console.error(response.error)
    } else {
        console.log(response.datas)
    }
}

test()
```


## All functions

#### new MyAnimeList()

| Parameter   | Type     | Description                      |
| :---------- | :------- | :------------------------------- |
| `client_id` | `string` | **Required**. Your MAL Client ID |


#### getAnimeInfo()

| Parameter   | Type      | Description                       |
| :---------- | :-------- | :-------------------------------- |
| `name`      | `string`  | **Required**.                     |
| `fields`    | `[array]` | Optional. More information in the "Available fields" section.                      |
| `limit` | `number` | Optional. Number of items in the response. (Maximum of 100) |
| `offset` | `number` | Optional. Default : `0` |
| `nsfw` | `boolean` | Optional. Default: `false` |


#### getSpecificAnimeInfo()

| Parameter   | Type      | Description                       |
| :---------- | :-------- | :-------------------------------- |
| `name`      | `string`  | **Required**.                     |
| `fields`    | `[array]` | Optional. More information in the "Available fields" section.                      |
| `nsfw` | `boolean` | Optional. Default: `false` |


#### getAnimeInfoByID()
| Parameter   | Type      | Description                       |
| :---------- | :-------- | :-------------------------------- |
| `id`      | `string`  | **Required**.                     |
| `fields`    | `[array]` | Optional. More information in the "Available fields" section.                      |
| `nsfw` | `boolean` | Optional. Default: `false` |


#### getAnimeRanking()

| Parameter   | Type      | Description                       |
| :---------- | :-------- | :-------------------------------- |
| `type`      | `string`  | Optional. More information in the "Available ranking types" section.                     |
| `fields`    | `[array]` | Optional. More information in the "Available fields" section.                      |
| `limit` | `number` | Optional. Number of items in the response. (Maximum of 500) |
| `offset` | `number` | Optional. Default : `0` |
| `nsfw` | `boolean` | Optional. Default: `false` |


#### getSeasonalAnime()

| Parameter   | Type      | Description                       |
| :---------- | :-------- | :-------------------------------- |
| `year`      | `string`  | Optional. Default: `current year`                     |
| `season` | `string` | Optional. Default: `current season (winter/spring/summer/fall)` |
| `fields`    | `[array]` | Optional. More information in the "Available fields" section.                      |
| `limit` | `number` | Optional. Number of items in the response. (Maximum of 100) |
| `offset` | `number` | Optional. Default : `0` |
| `nsfw` | `boolean` | Optional. Default: `false` |


#### getMangaInfo()

| Parameter   | Type      | Description                       |
| :---------- | :-------- | :-------------------------------- |
| `name`      | `string`  | **Required**.                     |
| `fields`    | `[array]` | Optional. More information in the "Available fields" section.                      |
| `limit` | `number` | Optional. Number of items in the response. (Maximum of 100) |
| `offset` | `number` | Optional. Default : `0` |
| `nsfw` | `boolean` | Optional. Default: `false` |

#### getSpecificMangaInfo()

| Parameter   | Type      | Description                       |
| :---------- | :-------- | :-------------------------------- |
| `name`      | `string`  | **Required**.                     |
| `fields`    | `[array]` | Optional. More information in the "Available fields" section.                      |
| `nsfw` | `boolean` | Optional. Default: `false` |


#### getMangaInfoByID()
| Parameter   | Type      | Description                       |
| :---------- | :-------- | :-------------------------------- |
| `id`      | `string`  | **Required**.                     |
| `fields`    | `[array]` | Optional. More information in the "Available fields" section.                      |
| `nsfw` | `boolean` | Optional. Default: `false` |


#### getMangaRanking()

| Parameter   | Type      | Description                       |
| :---------- | :-------- | :-------------------------------- |
| `type`      | `string`  | Optional. More information in the "Available ranking types" section.                     |
| `fields`    | `[array]` | Optional. More information in the "Available fields" section.                      |
| `limit` | `number` | Optional. Number of items in the response. (Maximum of 500) |
| `offset` | `number` | Optional. Default : `0` |
| `nsfw` | `boolean` | Optional. Default: `false` |
## Available fields

#### Global
`alternative_titles`: object or null

`start_date`: string or null

`end_date`: string or null

`synopsis`: string or null

`mean`: number or null <float>

`rank`: integer or null

`popularity`: integer or null

`num_list_users`: integer

`num_scoring_users`: integer

`nsfw`: string or null

| Value | Description |
| :---- | :---------- |
| white | This work is safe for work |
| gray | This work may be not safe for work |
| black | This work is not safe for work |

`Genres`: Array of objects

`created_at` : string <date-time>

`updated_at`: string <date-time>


## Anime only
`media_type`: string
- unknown
- tv
- ova
- movie
- special
- ona
- music

`status`: string
- finished_airing
- currently_airing
- not_yet_aired

`num_episodes`: integer

`start_season`: object or null

`broadcast`: object of null

`source`: string or null
- other
- original
- manga
- 4_koma_manga
- web_manga
- digital_manga
- novel
- light_novel
- visual_novel
- game
- card_game
- book
- picture_book
- radio
- music

`average_episode_duration`: integer or null <seconds>

`rating`: string or null
| Value | Description |
| :---- | :---------- |
| g | All ages |
| pg | Children |
| pg_13 | Teens 13 and Older |
| r | 17+ (violence & profanity) |
| r+ | Profanity & Mild Nudity |
| rx | Hentai |

`studios`: Array of objects

## Manga only
`media_type`: string
- unknown
- manga
- novel
- one_shot
- doujinshi
- manhwa
- manhua
- oel

`status`: string
- finished
- currently_publishing
- not_yet_published

`num_volumes`: integer

`num_chapters`: integer

`authors`: Array of objects
## Available ranking types

#### Global
`all`

`bypopularity`

`favorite`

#### Anime only
`airing`

`upcoming`

`tv`

`ova`

`movie`

`special`

#### Manga only
`manga`

`novels`

`oneshots`

`doujin`

`manhwa`

`manhua`

## Additional information

#### My Discord: https://discord.gg/2x9juZp9VX
#### NPM Module: coming soon