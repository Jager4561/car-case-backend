export interface AddCommentPayload {
  post: number;
  content: string;
  parent?: number;
}

export interface EditCommentPayload {
  content: string;
}

export interface Comment {
  id: number;
  status: 'published' | 'deleted' | 'blocked';
  date_created: string;
  date_updated: string;
  author: string;
  content: string;
  parent: number;
  ratings: CommentRating[];
}

export interface CommentRating {
  id: number;
  date_created: string;
  raring: number;
  comment: string;
  account: number;
}

export interface PostComment {
  id: string;
  status: 'published' | 'deleted' | 'blocked';
  date_created: string;
  date_updated: string | null;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  content: string;
  likes: number;
  dislikes: number;
  isLiked: boolean;
  isDisliked: boolean;
  isUserComment: boolean;
  children?: PostComment[];
}