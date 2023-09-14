export interface ApiInterface<T = void> {
  success: boolean;
  result?: T;
  errors?: string;
}
