import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MockApiService } from "./api/mock-api.service";
import {
  BehaviorSubject,
  catchError,
  filter,
  finalize,
  interval,
  map,
  Observable,
  of,
  switchMap,
  takeWhile,
} from "rxjs";
import { UserInterface } from "./shared/user.interface";
import { ApiInterface } from "./shared/api.interface";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  public loginResult$ = new BehaviorSubject<ApiInterface<UserInterface> | null>(null);
  public loginForm = this.initForm();
  public isLoading: boolean = false;
  public remainingLockTime$: Observable<number>;

  private readonly errorDisplayTimeout = 1000 * 5; // 5 секунд
  private readonly loginLockTimeout = 1000 * 60; // 1 минута
  private readonly loginLockStorageKey = 'loginTimeout';

  constructor(
    private fb: FormBuilder,
    private mockApiService: MockApiService,
  ) { }

  ngOnInit() {
    this.checkTimeoutLockInStorage();
    this.remainingLockTime$ = this.subscribeToRemainingTime();
  }

  public onLogin(): void {
    this.isLoading = true;
    this.mockApiService.tryLogin()
      .pipe(
        catchError((err) => {
          this.loginResult$.next(err.error)
          setTimeout(() => this.loginResult$.next(null), this.errorDisplayTimeout);
          return of({success: false});
        }),
        finalize(() => {
          this.setTimeoutLockIntoStorage();
          setTimeout(() => this.isLoading = false, this.loginLockTimeout);
        }),
        filter(res => res.success)
      )
      .subscribe(res => this.loginResult$.next(res))
  }

  private initForm(): FormGroup {
    return this.fb.group({
      login: [null, Validators.required],
      password: [null, Validators.required],
    })
  }

  private checkTimeoutLockInStorage(): void {
    if (localStorage.getItem(this.loginLockStorageKey)) {
      this.isLoading = true;
      setTimeout(() => this.isLoading = false, this.getRemainingTimeoutLockFromStorage());
    }
  }

  private setTimeoutLockIntoStorage(): void {
    const now = new Date();
    const lockTimeout = now.getTime() + this.loginLockTimeout;
    localStorage.setItem(this.loginLockStorageKey, JSON.stringify(lockTimeout));
  }

  private getRemainingTimeoutLockFromStorage(): number {
    const now = new Date();
    const lockTimeoutStr = localStorage.getItem(this.loginLockStorageKey) || '0';
    const lockTimeout = +JSON.parse(lockTimeoutStr);

    if (now.getTime() < lockTimeout) {
      return lockTimeout - now.getTime();
    }

    localStorage.removeItem(this.loginLockStorageKey);

    return 0;
  }

  private subscribeToRemainingTime(): Observable<number> {
    return interval(1000)
      .pipe(
        switchMap(() => of(this.getRemainingTimeoutLockFromStorage())),
        map(remainingTime => Math.floor(remainingTime / 1000)),
        takeWhile(remainingTime => remainingTime >= 0)
      )
  }
}
