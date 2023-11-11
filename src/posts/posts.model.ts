export interface DBPost {
  id: string;
  status: 'published' | 'draft';
  date_created: string;
  date_updated: string;
  title: string;
  model_generation: {
    id: string;
    name: string;
    image: string;
    model: {
      id: string;
      name: string;
      brand: {
        id: string;
        name: string;
        image: string;
      };
    };
  };
  model_engine: {
    id: string;
    name: string;
    capacity: number;
    horse_power: number;
    fuel: {
      id: string;
      name: string;
      color: string;
    };
  };
  model_hull_type: {
    id: string;
    name: string;
  };
  abstract: string;
  content: {
    type: 'text' | 'image';
    size?: number;
    content: string;
  }[];
  ratings: Rating[];
  author: {
    id: string;
    avatar: string;
    name: string;
  };
  comments: Comment[];
}

export interface Rating {
  id: string;
  date_created: string;
  rating: number;
  account: string;
}

export interface Comment {
  id: string;
  status: 'published' | 'deleted' | 'blocked';
  date_created: string;
  date_updated: string;
  author: {
    id: string;
    avatar: string;
    name: string;
  };
  content: string;
  parent: string;
  ratings: Rating[];
}

export interface AddPostPayload {
  status: 'published' | 'draft';
  title: string;
  abstract: string;
  brand: number;
  model: number;
  generation: number;
  engine: number;
  hull_type: number;
  sections: {
    index: number;
    type: 'text' | 'image';
    size?: number;
    content: string;
    file: number;
  }[];
}