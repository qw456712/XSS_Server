# BLACKSITE — Authorized XSS Callback Dashboard

승인된 보안진단에서 XSS 또는 모의 피싱 링크가 실제 실행/열람되었는지만 확인하는 최소 수집형 대시보드입니다.

## 수집 항목
- Campaign ID
- 이벤트 유형
- 실행 페이지 URL
- Referrer
- User-Agent
- 서버 수신 시각


## 배포
드래그앤드롭 수동 배포는 빌드 및 Functions 의존성 설치가 수행되지 않으므로 GitHub 저장소 연결 또는 Netlify CLI 배포를 사용하십시오.

1. 이 폴더를 GitHub 저장소에 업로드합니다.
2. Netlify에서 `Import an existing project`로 저장소를 연결합니다.
3. 환경변수 `DASHBOARD_TOKEN`을 길고 임의적인 값으로 설정합니다.
4. 선택사항: `ALLOWED_ORIGIN`을 허용할 테스트 대상 Origin으로 설정합니다. 여러 외부 대상에서 콜백을 받아야 하면 기본값 `*`를 사용할 수 있으나 공개 엔드포인트가 됩니다.
5. 배포 후 대시보드에서 Collector base URL과 Campaign ID를 지정해 콜백 코드를 생성합니다.

## 로컬 개발
```bash
npm install
npx netlify dev
```

## 운영 주의사항
- 사전 승인된 대상과 기간에만 사용
- 캠페인별 식별자는 비식별 값 사용
- 진단 종료 후 이벤트 삭제
- 공개 URL 유출 시 즉시 토큰 교체 및 프로젝트 중지
