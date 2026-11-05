/**
 * 포토부스 사진·영상 저장용 Apps Script
 * - 내 구글 드라이브에 '포토부스' 폴더를 만들고, 촬영할 때마다 그 안에 작은 폴더를 하나씩 만듭니다.
 * - 작은 폴더는 "링크가 있는 모든 사용자 보기"로 공유되어, 사진에 찍힌 QR로 휴대폰에서 바로 열립니다.
 *
 * 배포: 배포 > 새 배포 > 유형 '웹 앱'
 *   - 다음 사용자 인증 정보로 실행: 나
 *   - 액세스 권한이 있는 사용자: 모든 사용자
 * 배포 후 나오는 '웹 앱 URL'(…/exec)을 포토부스 교사 설정의 '저장 주소'에 넣으세요.
 */
const ROOT_NAME = '포토부스';

function doGet(e) {
  // 연결 시험용
  return json_({ ok: true, folder: ROOT_NAME });
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const sid = String(d.sid || '').replace(/[^0-9A-Za-z_-]/g, '');
    if (!sid) throw new Error('sid 없음');
    const folder = sessionFolder_(sid);

    if (d.action === 'folder') {
      return json_({ ok: true, folderUrl: folder.getUrl() });
    }
    if (d.action === 'file') {
      const m = String(d.data || '').match(/^data:([^;]+);base64,(.*)$/);
      if (!m) throw new Error('파일 형식이 맞지 않음');
      const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], String(d.name || 'file'));
      const f = folder.createFile(blob);
      return json_({ ok: true, fileUrl: f.getUrl(), folderUrl: folder.getUrl() });
    }
    throw new Error('알 수 없는 요청');
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function rootFolder_() {
  const it = DriveApp.getFoldersByName(ROOT_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(ROOT_NAME);
}

function sessionFolder_(sid) {
  const root = rootFolder_();
  const it = root.getFoldersByName(sid);
  if (it.hasNext()) return it.next();
  const f = root.createFolder(sid);
  f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return f;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/** 처음 한 번 실행해서 드라이브 권한을 허용해 두세요(편집기에서 이 함수를 골라 ▶ 실행). */
function setup() {
  const f = rootFolder_();
  Logger.log('저장 폴더: ' + f.getUrl());
}
