/**
 * Pinata IPFS 유틸리티 (SDK 버전)
 * 
 * 기능:
 * - JSON 메타데이터를 Pinata에 업로드
 * - IPFS URI 반환
 * - 공식 Pinata SDK 사용
 * 
 * 환경변수:
 * - PINATA_API_KEY: Pinata API 키
 * - PINATA_SECRET_API_KEY: Pinata Secret API 키
 */

import pinataSDK from '@pinata/sdk';

// Pinata 클라이언트 초기화 (싱글톤 패턴)
let pinataClient: any = null;

function getPinataClient() {
  if (pinataClient) {
    return pinataClient;
  }
  
  const apiKey = process.env.PINATA_API_KEY;
  const secretApiKey = process.env.PINATA_SECRET_API_KEY;
  
  if (!apiKey || !secretApiKey) {
    throw new Error('Pinata API keys not configured. Please set PINATA_API_KEY and PINATA_SECRET_API_KEY in .env');
  }
  
  pinataClient = new pinataSDK(apiKey, secretApiKey);
  return pinataClient;
}

/**
 * JSON 데이터를 Pinata에 업로드하고 IPFS URI 반환
 * 
 * @param metadata - 업로드할 JSON 메타데이터
 * @param name - 파일 이름 (선택사항)
 * @returns IPFS URI (예: ipfs://QmXxxx...)
 */
export async function uploadJsonToPinata(metadata: any, name?: string): Promise<string> {
  try {
    console.log('[pinata] Uploading JSON to Pinata...');
    
    const pinata = getPinataClient();
    
    const options: any = {
      pinataOptions: {
        cidVersion: 1
      }
    };
    
    if (name) {
      options.pinataMetadata = { name };
    }
    
    const result = await pinata.pinJSONToIPFS(metadata, options);
    
    const ipfsUri = `ipfs://${result.IpfsHash}`;
    
    console.log('[pinata] Upload successful:', ipfsUri);
    console.log('[pinata] Pin size:', result.PinSize, 'bytes');
    console.log('[pinata] Timestamp:', result.Timestamp);
    
    return ipfsUri;
    
  } catch (error: any) {
    console.error('[pinata] Upload failed:', error.message);
    
    if (error.message.includes('Invalid authentication')) {
      throw new Error('Pinata authentication failed. Check your API keys.');
    }
    
    throw new Error(`Failed to upload to Pinata: ${error.message}`);
  }
}

/**
 * Pinata 연결 테스트
 * 
 * @returns 인증 성공 여부
 */
export async function testPinataConnection(): Promise<boolean> {
  try {
    const pinata = getPinataClient();
    
    const result = await pinata.testAuthentication();
    
    console.log('[pinata] Authentication test successful');
    console.log('[pinata] Authenticated:', result.authenticated);
    
    return result.authenticated === true;
    
  } catch (error: any) {
    console.error('[pinata] Authentication test failed:', error.message);
    return false;
  }
}

/**
 * 핀된 파일 목록 조회 (추가 기능)
 * 
 * @param options - 필터 옵션
 * @returns 핀된 파일 목록
 */
export async function listPinnedFiles(options?: any) {
  try {
    const pinata = getPinataClient();
    
    const result = await pinata.pinList(options);
    
    console.log('[pinata] Found', result.count, 'pinned files');
    
    return result.rows;
    
  } catch (error: any) {
    console.error('[pinata] List failed:', error.message);
    throw new Error(`Failed to list pinned files: ${error.message}`);
  }
}

/**
 * 파일 언핀 (IPFS에서 제거)
 * 
 * @param hash - IPFS 해시 (ipfs:// 접두사 제외)
 * @returns 성공 여부
 */
export async function unpinFile(hash: string): Promise<boolean> {
  try {
    const pinata = getPinataClient();
    
    // ipfs:// 접두사 제거
    const cleanHash = hash.replace('ipfs://', '');
    
    await pinata.unpin(cleanHash);
    
    console.log('[pinata] Unpinned:', cleanHash);
    
    return true;
    
  } catch (error: any) {
    console.error('[pinata] Unpin failed:', error.message);
    return false;
  }
}
