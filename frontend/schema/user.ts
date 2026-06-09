export type User = {
  createdAt: Date;
  updatedAt: Date;
  contact: string | null;
  license: string | null;
  image: string | null;
  email: string | null;
  name: string | null;
  id: string;
  workSpaceId: string;
  workSpace: {
    name: string;
    id: string;
    license: string;
    apiurl: string;
    createdAt: Date;
    updatedAt: Date;
    createdById: string | null;
  };
};
