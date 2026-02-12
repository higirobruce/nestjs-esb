export enum FailureMode {
  FAIL_FAST = 'fail_fast',
  RETRY = 'retry',
  COMPENSATE = 'compensate',
  CIRCUIT_BREAKER = 'circuit_breaker',
}
