import { Person, Group } from './types';

export const BUSINESS_UNITS = [
  "東森購物",
  "生技(栢馥)",
  "東森國際",
  "東森資產",
  "大陸自然美",
  "台灣自然美",
  "新媒體",
  "民調雲",
  "東森保代",
  "寵物雲",
  "慈愛",
  "草莓網",
  "東森房屋",
  "分眾傳媒",
  "全球(直消)"
];

export const parseCSV = (content: string, defaultDepartment?: string): Person[] => {
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  const people: Person[] = [];

  lines.forEach((line, index) => {
    // Handle CSV or simple list
    const parts = line.split(',');
    let name = parts[0].trim();
    
    // Logic: If the CSV line has a second part (department), use it (Priority 1).
    // Otherwise, use the dropdown/default selection (Priority 2).
    let department = parts.length > 1 && parts[1].trim() !== '' ? parts[1].trim() : defaultDepartment;

    // Clean up simple index numbers like "1. Name"
    name = name.replace(/^\d+[\.\)]\s*/, '');

    if (name) {
      people.push({
        id: `p-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More unique ID
        name,
        department
      });
    }
  });

  return people;
};

export const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const chunkArray = <T,>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const generateDemoData = (): string => {
  const surnames = ["陳", "林", "黃", "張", "李", "王", "吳", "劉", "蔡", "楊", "許", "鄭", "謝", "郭", "洪"];
  const names = ["怡君", "欣怡", "雅婷", "志明", "雅雯", "家豪", "宗翰", "冠宇", "淑芬", "承翰", "俊傑", "建宏", "美玲", "惠君", "淑惠"];
  
  const demoData: string[] = [];
  
  // Generate people for each business unit to show diversity
  BUSINESS_UNITS.forEach(unit => {
      // Create 2-3 people per unit
      const count = 2 + Math.floor(Math.random() * 2);
      for(let i=0; i<count; i++) {
          const randomSurname = surnames[Math.floor(Math.random() * surnames.length)];
          const randomName = names[Math.floor(Math.random() * names.length)];
          // Ensure format is "Name, Unit"
          demoData.push(`${randomSurname}${randomName}, ${unit}`);
      }
  });

  // Shuffle the list so units are mixed up in the text area
  return shuffleArray(demoData).join("\n");
};

export const downloadGroupsCSV = (groups: Group[]) => {
  // Add BOM for Excel utf-8 compatibility
  let csvContent = "\uFEFF組別,姓名,部門\n";
  
  groups.forEach(group => {
    group.members.forEach(member => {
      const dept = member.department ? member.department : "";
      csvContent += `${group.name},${member.name},${dept}\n`;
    });
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `分組結果_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
