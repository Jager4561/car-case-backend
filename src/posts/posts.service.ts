import { AddPostPayload, DBPost } from './posts.model';

export const countLikesAndDislikes = (ratings: any, account: string | null) => {
	let likesCount = 0;
	let dislikesCount = 0;
	let liked = false;
	let disliked = false;

	ratings.forEach((rating: any) => {
		if (rating.rating) {
			likesCount++;
		} else {
			dislikesCount++;
		}
		if (rating.account && account && rating.account === account) {
			if (rating.rating) {
				liked = true;
			} else {
				disliked = true;
			}
		}
	});

	return {
		likesCount,
		dislikesCount,
		liked,
		disliked,
	};
};

export const verifyAddPostPayload = (payload: AddPostPayload) => {
	let result = null;

	if (!payload.status) {
		return `Missing 'status' field`;
	}
	if (!payload.title) {
		return `Missing 'title' field`;
	}
	if (payload.title.length < 3) {
		return `'title' field must be at least 3 characters long`;
	}
	if (!payload.abstract) {
		return `Missing 'abstract' field`;
	}
	if (payload.abstract.length < 3) {
		return `'abstract' field must be at least 3 characters long`;
	}
	if (!payload.brand) {
		return `Missing 'brand' field`;
	}
	if (!payload.model) {
		return `Missing 'model' field`;
	}
	if (!payload.generation) {
		return `Missing 'generation' field`;
	}
	if (!payload.engine) {
		return `Missing 'engine' field`;
	}
	if (!payload.hull_type) {
		return `Missing 'hull_type' field`;
	}
	if (!payload.sections) {
		return `Missing 'sections' field`;
	}
	if (!Array.isArray(payload.sections)) {
		return `'sections' field must be an JSON array`;
	}
	if (payload.sections.length < 1) {
		return `'sections' field must have at least one element`;
	}
	return result;
};

export const parsePost = (
	dbPost: DBPost,
	session: {
		accountId: string;
		sessionId: string;
		expired: boolean;
	} | null
) => {
	const postRatings = countLikesAndDislikes(
		dbPost.ratings,
		session ? session.accountId : null
	);
	const comments = dbPost.comments
		.filter((comment) => comment.parent == null)
		.map((comment) => {
			const ratings = countLikesAndDislikes(
				comment.ratings,
				session ? session.accountId : null
			);

			const childrenComments = dbPost.comments
				.filter(
					(childComment: any) => childComment.parent === comment.id
				)
				.map((childComment: any) => {
					const ratings = countLikesAndDislikes(
						childComment.ratings,
						session ? session.accountId : null
					);
					return {
						id: childComment.id,
						status: childComment.status,
						date_created: childComment.date_created,
						date_updated: childComment.date_updated,
						author: childComment.author,
						content: childComment.content,
						likes: ratings.likesCount,
						dislikes: ratings.dislikesCount,
						isLiked: ratings.liked,
						isDisliked: ratings.disliked,
						isUserComment:
							session != null &&
							childComment.author &&
							childComment.author.id === session.accountId,
					};
				})
				.sort(
					(a, b) =>
						new Date(b.date_created).getTime() -
						new Date(a.date_created).getTime()
				);

			return {
				id: comment.id,
				status: comment.status,
				date_created: comment.date_created,
				date_updated: comment.date_updated,
				author: comment.author,
				content: comment.content,
				likes: ratings.likesCount,
				dislikes: ratings.dislikesCount,
				isLiked: ratings.liked,
				isDisliked: ratings.disliked,
				isUserComment:
					session != null &&
					comment.author &&
					comment.author.id === session.accountId,
				children: childrenComments,
			};
		})
		.sort(
			(a, b) =>
				new Date(b.date_created).getTime() -
				new Date(a.date_created).getTime()
		);

	const model = {
		id: dbPost.model_generation.model.id,
		name: dbPost.model_generation.model.name,
		brand: dbPost.model_generation.model.brand,
		generation: {
			id: dbPost.model_generation.id,
			name: dbPost.model_generation.name,
			image: dbPost.model_generation.image,
		},
		hull_type: {
			id: dbPost.model_hull_type.id,
			name: dbPost.model_hull_type.name,
		},
		engine: {
			id: dbPost.model_engine.id,
			name: dbPost.model_engine.name,
			capacity: dbPost.model_engine.capacity,
			horse_power: dbPost.model_engine.horse_power,
			fuel: {
				id: dbPost.model_engine.fuel.id,
				name: dbPost.model_engine.fuel.name,
				color: dbPost.model_engine.fuel.color,
			},
		},
	};

	return {
		id: dbPost.id,
		status: dbPost.status,
		date_created: dbPost.date_created,
		date_updated: dbPost.date_updated,
		title: dbPost.title,
		abstract: dbPost.abstract,
    content: dbPost.content,
		likes: postRatings.likesCount,
		dislikes: postRatings.dislikesCount,
		isLiked: postRatings.liked,
		isDisliked: postRatings.disliked,
		model: model,
		comments: comments,
		author: dbPost.author,
	};
};
