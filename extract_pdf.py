import pdfplumber

pdf_path = r'C:\Users\kosuk\OneDrive\ドキュメント\Kiro\shuttle-bus\シャトルバス時刻表.pdf'

with pdfplumber.open(pdf_path) as pdf:
    print(f"総ページ数: {len(pdf.pages)}\n")
    
    for page_num, page in enumerate(pdf.pages):
        print(f"\n===== ページ {page_num + 1} =====\n")
        
        # テキストを抽出
        text = page.extract_text()
        if text:
            print(text)
        else:
            print("テキスト抽出できず")
        
        # テーブルを抽出
        tables = page.extract_tables()
        if tables:
            print(f"\nテーブル数: {len(tables)}")
            for table_idx, table in enumerate(tables):
                print(f"\n--- テーブル {table_idx + 1} ---")
                for row in table:
                    print('|'.join(str(cell) if cell else '' for cell in row))
