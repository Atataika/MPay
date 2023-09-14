import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable()
export class MockApiService {
  constructor(private httpClient: HttpClient) { }

  public tryLogin(): Observable<any> {
    const urlResultMap = {
      success: "https://run.mocky.io/v3/5664b957-eef4-4254-9776-91014939fdfa",
      error: "https://run.mocky.io/v3/5f5d813a-5eac-45ec-8735-2903cddbec96",
    }
    const isSuccessRequest = Math.round(Math.random());
    const randomRequest = isSuccessRequest ? urlResultMap['success'] : urlResultMap['error'];

    return this.httpClient.get(randomRequest)
  }
}
