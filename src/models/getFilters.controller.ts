import { Request, Response } from 'express';
import { getCurrentTime } from '../helpers';
import { Directus } from '@directus/sdk';

export async function getFiltersController(req: Request, res: Response) {
	try {
		const directus = new Directus(
			process.env.DIRECTUS_URL || 'http://localhost:8055',
			{
				auth: {
					staticToken: process.env.DIRECTUS_TOKEN || '',
				},
			}
		);
		const brands = await directus.items('cc_brands').readByQuery({
			fields: ['*'],
			limit: -1,
		});
		const models = await directus.items('cc_models').readByQuery({
			fields: ['id', 'name', 'generations.id', 'generations.name', 'brand'],
      limit: -1
		});
		const fuels = await directus.items('cc_fuels').readByQuery({
			fields: ['id', 'name', 'color'],
      limit: -1
		});
		const hullTypes = await directus.items('cc_hull_types').readByQuery({
			fields: ['id', 'name'],
      limit: -1
		});
    const authors = await directus.items('cc_users').readByQuery({
      fields: ['id', 'name', 'avatar'],
      limit: -1
    });
    const posts = await directus.items('cc_posts').readByQuery({
      fields: ['author'],
      limit: -1
    })
		if (brands.data == null || brands.data.length === 0) {
			return res.status(200).send({
        brands: [],
        fuels: fuels.data,
        hull_types: hullTypes.data,
        author: authors.data && posts.data ? authors.data?.filter(author => {
          return posts.data?.find(post => post.author === author.id)
        }) : []
      });
		}

    const parsedBrands = brands.data.map(brand => {
      const brandModels = models.data?.filter((model) => {
        return model.brand === brand.id;
      }).map((model) => {
        return {
          id: model.id,
          name: model.name,
          generations: model.generations.map((generation: any) => {
            return {
              id: generation.id,
              name: generation.name,
            };
          }),
        }
      });

      return {
        id: brand.id,
        name: brand.name,
        models: brandModels
      };
    });
		console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`);
		return res.status(200).send({
			brands: parsedBrands,
			fuels: fuels.data,
			hull_types: hullTypes.data,
      authors: authors.data && posts.data ? authors.data?.filter(author => {
        return posts.data?.find(post => post.author === author.id)
      }) : []
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
