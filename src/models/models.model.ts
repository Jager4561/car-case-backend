export interface CCFuel {
  id: number;
  name: string;
  color: string;
}

export interface CCHullType {
  id: number;
  name: string;
}

export interface CCBrand {
  id: number;
  date_created: string;
  logo: string;
  name: string;
}

export interface CCModel {
  id: number;
  date_craeted: string;
  model: string;
  brand: CCBrand;
  image: string;
  production_start: string;
  production_end: string;
  fuels: CCFuel[];
  hull_types: CCHullType[];
}