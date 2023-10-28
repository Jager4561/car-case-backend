import { Request, Response } from 'express';
import { getCurrentTime } from '../helpers';
import { Directus } from '@directus/sdk';
import { countLikesAndDislikes } from './posts.service';

export async function getPostsController(req: Request, res: Response) {
	const { search, sort, dateFrom, dateTo, brand, model, generation, author, page } =
		req.query as {
      search: string;
      sort: string;
      dateFrom: string;
      dateTo: string;
      brand: string;
      model: string;
      generation: string;
      author: string;
      page: string;
    };
	try {
		const directus = new Directus(
			process.env.DIRECTUS_URL || 'http://localhost:8055',
			{
				auth: {
					staticToken: process.env.DIRECTUS_TOKEN || '',
				},
			}
		);
		const filterRules: any[] = [
			{
				status: {
					_eq: 'published',
				},
			},
      {
        model_generation: {
          _nnull: true,
        }
      },
      {
        model_engine: {
          _nnull: true,
        }
      },
      {
        model_hull_type: {
          _nnull: true,
        }
      }
		];
		if (brand) {
			filterRules.push({
        model_generation: {
          model: {
            brand: {
              _eq: +brand,
            },
          }
        }
			});
		}
		if (model) {
			filterRules.push({
				model_generation: {
          model: {
            _eq: +model,
          }
				},
			});
		}
		if (generation) {
			filterRules.push({
				model_generation: {
					_eq: +generation,
				},
			});
		}
		if (dateFrom) {
			filterRules.push({
				date_created: {
					_gte: new Date(dateFrom).toISOString(),
				},
			});
		}
		if (dateTo) {
			filterRules.push({
				date_created: {
					_lte: new Date(dateTo).toISOString(),
				},
			});
		}
		if (author) {
			filterRules.push({
				author: {
					_eq: author,
				},
			});
		}
    let wantedPage = 0;
    if(page) {
      wantedPage = +page;
    }
    let wantedOffset = 20;
		let sortMethod: string[] = [];
		switch (sort) {
			case 'latest': {
				sortMethod = ['-date_created'];
				break;
			}
			case 'oldest': {
				sortMethod = ['date_created'];
				break;
			}
			case 'name_asc': {
				sortMethod = ['title'];
				break;
			}
			case 'name_desc': {
				sortMethod = ['-title'];
				break;
			}
		}
		const posts = await directus.items('cc_posts').readByQuery({
			fields: [
				'*',
				'brand.*',
				'vehicle.*',
				'model.*',
        'model_generation.id',
        'model_generation.name',
        'model_generation.image',
        'model_generation.model.*',
        'model_generation.model.brand.*',
        'model_engine.id',
        'model_engine.name',
        'model_engine.capacity',
        'model_engine.horse_power',
        'model_engine.fuel.*',
        'model_hull_type.*',
				'author.id',
				'author.avatar',
				'author.name',
				'comments.*',
        'comments.author.id',
        'comments.author.avatar',
        'comments.author.name',
				'ratings.*',
				'ratings.account',
			],
			filter: {
				_and: filterRules,
			},
			sort: sortMethod as any,
			limit: -1,
      search: search ? search : undefined,
		});
		if (posts.data == null || posts.data.length === 0) {
			console.log(
				`[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`
			);
			return res.status(200).send({
        posts: [],
        meta: {
          total: 0,
          per_page: wantedOffset,
        }
      });
		}
		console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`);
		const session = res.locals.session;
    let sliceStart = wantedOffset * wantedPage;
    let sliceEnd = wantedOffset * (wantedPage + 1);
    if(wantedOffset > 1) {
      sliceStart = wantedOffset * wantedPage;
      sliceEnd = wantedOffset * (wantedPage + 1) - 1;
    }
		let parsedPosts = posts.data.slice(sliceStart, sliceEnd).map((post) => {
			const postRatings = countLikesAndDislikes(post.ratings, session ? session.user.id : null);
			const comments = post.comments
				.filter((comment: any) => comment.parent == null)
				.map((comment: any) => {
					const ratings = countLikesAndDislikes(comment.ratings, session ? session.user.id : null);

          const childrenComments = post.comments
            .filter((childComment: any) => childComment.parent === comment.id)
            .map((childComment: any) => {
              const ratings = countLikesAndDislikes(childComment.ratings, session ? session.user.id : null);
              return {
                id: childComment.id,
                date_created: childComment.date_created,
                date_modified: childComment.date_modified,
                author: childComment.author,
                content: childComment.content,
                likes: ratings.likesCount,
                dislikes: ratings.dislikesCount,
                isLiked: ratings.liked,
                isDisliked: ratings.disliked,
                isUserComment:
                  session && childComment.author === session.user.id,
              };
            }).sort((a: any, b: any) => new Date(a.date_created).getTime() - new Date(b.date_created).getTime());;

					return {
						id: comment.id,
						date_created: comment.date_created,
						date_modified: comment.date_modified,
            author: comment.author,
						content: comment.content,
						likes: ratings.likesCount,
						dislikes: ratings.dislikesCount,
						isLiked: ratings.liked,
						isDisliked: ratings.disliked,
						isUserComment:
							session && comment.author === session.user.id,
            children: childrenComments
					};
				}).sort((a: any, b: any) => new Date(a.date_created).getTime() - new Date(b.date_created).getTime());

      const model = {
        id: post.model_generation.model.id,
        name: post.model_generation.model.name,
        brand: post.model_generation.model.brand,
        generation: {
          id: post.model_generation.id,
          name: post.model_generation.name,
          image: post.model_generation.image,
        },
        hull_type: {
          id: post.model_hull_type.id,
          name: post.model_hull_type.name,
        },
        engine: {
          id: post.model_engine.id,
          name: post.model_engine.name,
          capacity: post.model_engine.capacity,
          horse_power: post.model_engine.horse_power,
          fuel: {
            id: post.model_engine.fuel.id,
            name: post.model_engine.fuel.name,
            color: post.model_engine.fuel.color,
          }
        }
      };

			return {
				id: post.id,
				date_created: post.date_created,
				date_modified: post.date_modified,
				title: post.title,
				abstract: post.abstract,
				content: post.content,
				likes: postRatings.likesCount,
				dislikes: postRatings.dislikesCount,
				isLiked: postRatings.liked,
				isDisliked: postRatings.disliked,
				model: model,
        comments: comments,
				author: post.author,
			};
		});
    switch(sort) {
      case 'mostPopular': {
        parsedPosts = parsedPosts.sort((a: any, b: any) => {
          return b.likes - a.likes;
        });
        break;
      }
      case 'leastPopular': {
        parsedPosts = parsedPosts.sort((a: any, b: any) => {
          return a.likes - b.likes;
        });
        break;
      }
    }
		return res.status(200).send({
      posts: parsedPosts,
      meta: {
        total: posts.data.length,
        per_page: wantedOffset,
      }
    });
	} catch (error) {
		console.log(
			`[${getCurrentTime()}] ${req.method} ${req.url} 500 Bad Request`
		);
		console.error(error);
		return res.status(400).send({
			type: 'internal_server_error',
			message: 'Internal server error',
		});
	}
}
