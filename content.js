"use strict";

const scenarios = { work: "ที่ทำงาน", travel: "การเดินทาง", daily: "ชีวิตประจำวัน" };

const lessons = [
  {
    scenario: "work", id: "small-talk", skill: "speaking", title: "Make small talk", minutes: 7,
    goal: "เริ่มบทสนทนากับเพื่อนร่วมงานและถามต่อจากสิ่งที่อีกฝ่ายบอก",
    type: "เลือกบทตอบ · การโต้ตอบ",
    context: "You meet Maya in the office kitchen on Monday morning. She says, “I went hiking on Saturday.”",
    question: "คุณจะถามต่ออย่างไรให้บทสนทนาดำเนินต่อไป?",
    choices: ["That sounds fun! Where did you go?", "I see. Let's get back to work.", "Did you go to the office on Saturday?"],
    answer: 0,
    reason: "คำตอบแรกตอบรับเรื่องที่มายาเล่า แล้วใช้ Where ถามต่อให้เธอเล่ารายละเอียดได้",
    conversation: {
      speaker: "Maya", avatar: "assets/illustrations/avatar-maya.jpg",
      setting: "เช้าวันจันทร์ คุณเจอมายาที่ออฟฟิศ ลองชวนเธอคุยต่อจากสิ่งที่เธอเล่า",
      speaking: "ลองพูดประโยคที่เลือกออกเสียง แล้วถามต่ออีกข้อ เช่น What was the trail like?",
      opening: "I went hiking on Saturday.",
      replies: [
        ["I went up to Doi Suthep. Have you been?", "คุณถามต่อจากเรื่องที่มายาเล่า เธอเลยเล่ารายละเอียดและชวนคุณคุยต่อ"],
        ["Sure. See you later.", "คำตอบนี้จบบทสนทนา ลองถามว่ามายาไปเดินเขาที่ไหน"],
        ["No, I was hiking.", "มายาเพิ่งเล่าว่าไปเดินเขา ลองถามรายละเอียดของทริปต่อ"],
      ],
    },
  },
  {
    scenario: "work", id: "change-of-plan", skill: "listening", title: "A change of plan", minutes: 5,
    goal: "จับเวลาใหม่และสิ่งที่ต้องเตรียมจากข้อความเสียง",
    type: "ฟังแล้วตอบ",
    context: "Hi, it's Nina. Our design meeting has moved from Tuesday morning to Thursday at two. Please bring your draft. I'll send the new room number later.",
    question: "การประชุมเลื่อนไปเป็นวันและเวลาใด?",
    choices: ["Tuesday at two", "Thursday at two", "Thursday morning"],
    answer: 1,
    reason: "วลี “has moved from Tuesday morning to Thursday at two” บอกเวลาเดิมหลัง from และเวลาใหม่หลัง to",
    followUps: [
      { question: "Nina ขอให้เอาอะไรไปด้วย?", choices: ["A room map", "Your draft", "A laptop"], answer: 1, reason: "Please bring your draft คือขอให้นำฉบับร่างมาด้วย" },
      { question: "ข้อมูลอะไรจะตามมาทีหลัง?", choices: ["The new room number", "The meeting date", "The name of the designer"], answer: 0, reason: "Nina จะส่งเลขห้องใหม่ให้ทีหลัง" },
    ],
  },
  {
    scenario: "work", id: "read-between", skill: "reading", title: "Read the team update", minutes: 4,
    goal: "แยกข้อมูลที่เปลี่ยนจากสิ่งที่ต้องทำหลังอ่านข้อความทีม",
    type: "อ่านแล้วตอบ",
    context: "The launch date stays the same. We're moving tomorrow's review online because the meeting room is booked. Please read the draft agenda before the call.",
    question: "ทีมขอให้คุณทำอะไรล่วงหน้า?",
    choices: ["Book a meeting room", "Change the launch date", "Read the draft agenda"],
    answer: 2,
    reason: "ประโยคท้ายระบุให้เปิดอ่านร่างวาระก่อนเข้าประชุม",
    followUps: [
      { question: "เหตุใดการประชุมจึงย้ายไปออนไลน์?", choices: ["The team is on holiday", "The launch is delayed", "The meeting room is booked"], answer: 2, reason: "Because the meeting room is booked แปลว่าห้องประชุมมีคนจองแล้ว" },
      { question: "อะไรยังคงเดิม?", choices: ["The launch date", "The meeting room", "The meeting format"], answer: 0, reason: "ประโยคแรกบอกว่าวันเปิดตัวยังเหมือนเดิม" },
    ],
  },
  {
    scenario: "work", id: "confirm-a-time", skill: "writing", title: "Confirm a meeting", minutes: 6,
    goal: "เขียนข้อความยืนยันนัดอย่างกระชับและถามรายละเอียดที่ยังขาด",
    type: "เขียนจากสถานการณ์",
    context: "Nina has moved the design meeting to Thursday at 2 p.m. She asked you to bring your draft. You don't know where the meeting will take place.",
    question: "เขียนตอบ Nina โดยยืนยันเวลาและสิ่งที่จะนำมา แล้วถามสถานที่",
    checklist: ["ยืนยันวันพฤหัสบดี เวลา 14.00 น.", "ระบุว่าจะนำฉบับร่างไป", "ถามให้ชัดว่าประชุมที่ห้องไหน"],
    model: "Hi Nina, Thursday at 2 p.m. works for me. I'll bring my draft. Could you let me know which room we're meeting in? Thanks!",
  },
  {
    scenario: "travel", id: "platform-change", skill: "listening", title: "Catch the right train", minutes: 5,
    goal: "ฟังประกาศสถานีเพื่อระบุชานชาลา เวลา และจุดจอด",
    type: "ฟังประกาศ",
    context: "Attention, passengers for Brighton. The 10:40 service will now leave from platform six instead of platform two. The train is running ten minutes late because of a signal problem. It will stop at East Croydon as usual. If you need step-free access, please use the lift next to the café.",
    question: "ควรไปขึ้นรถไฟที่ชานชาลาไหน?",
    choices: ["Platform two", "Platform four", "Platform six"], answer: 2,
    reason: "From platform six instead of platform two คือให้ขึ้นชานชาลา 6 แทนชานชาลา 2",
    followUps: [
      { question: "เวลาออกโดยประมาณคือกี่โมง?", choices: ["10:30", "10:40", "10:50"], answer: 2, reason: "รถรอบ 10:40 ล่าช้า 10 นาที จึงคาดว่าจะออกประมาณ 10:50" },
      { question: "หากขึ้นบันไดไม่สะดวก ควรไปที่ใด?", choices: ["The lift next to the café", "The ticket office", "The stairs near platform two"], answer: 0, reason: "ประกาศบอกให้ใช้ลิฟต์ข้างคาเฟ่" },
    ],
  },
  {
    scenario: "travel", id: "ask-for-a-route", skill: "speaking", title: "Ask for a better route", minutes: 5,
    goal: "บอกข้อจำกัดและขอเส้นทางที่เหมาะกว่าอย่างสุภาพ",
    type: "โต้ตอบที่สถานี",
    question: "คุณมีกระเป๋าหนัก ควรถามต่ออย่างไร?",
    choices: ["Is there a charge to cross the bridge?", "Is there a route with a lift? I've got a heavy suitcase.", "Can you tell me what time the museum closes?"],
    answer: 1,
    conversation: {
      speaker: "Station attendant", avatar: "assets/illustrations/avatar-attendant.jpg",
      setting: "คุณจะไปพิพิธภัณฑ์และมีกระเป๋าเดินทางหนัก พนักงานชี้ทางที่ต้องขึ้นบันได",
      opening: "The quickest way to the museum is over the footbridge, but there are quite a few stairs.",
      replies: [
        ["The bridge is free, but it only has stairs.", "ราคาทางเดินไม่ได้ช่วยแก้เรื่องกระเป๋าหนัก ควรระบุว่าต้องการเส้นทางที่มีลิฟต์"],
        ["Yes. Take the lift to street level, then turn right at the pharmacy. It's about five minutes longer.", "คุณบอกข้อจำกัดและขอทางเลือกชัดเจน จึงได้รับเส้นทางที่ใช้ได้จริง"],
        ["I'm not sure about opening hours. Do you need help getting there?", "เวลาเปิดปิดเป็นคนละเรื่องกับการหาเส้นทางที่เดินสะดวก"],
      ],
      speaking: "ลองพูดคำขอออกเสียง แล้วทวนเส้นทางกลับ เช่น So I take the lift and turn right at the pharmacy, is that right?",
    },
  },
  {
    scenario: "travel", id: "read-hotel-arrival", skill: "reading", title: "Arrive after reception closes", minutes: 5,
    goal: "อ่านคำแนะนำเช็กอินและแยกสิ่งที่ต้องทำก่อนเดินทาง",
    type: "อ่านข้อความจากโรงแรม",
    context: "Reception closes at 9 p.m. If you expect to arrive later, reply before 6 p.m. on the day of arrival. We will send you a temporary code for the side entrance and leave your key in the box marked with your room number. Please bring your passport to reception the next morning. If your plans change and you arrive before 9 p.m., use the main entrance.",
    question: "หากคาดว่าจะถึงเวลา 22.00 น. ควรทำอะไรล่วงหน้า?",
    choices: ["Reply before 6 p.m. that day", "Book another room", "Call after 9 p.m."], answer: 0,
    reason: "ผู้มาถึงหลังสามทุ่มต้องตอบกลับก่อนหกโมงเย็นในวันเข้าพัก",
    followUps: [
      { question: "จะใช้รหัสชั่วคราวที่ใด?", choices: ["The room door", "The main entrance", "The side entrance"], answer: 2, reason: "คำแนะนำระบุว่ารหัสใช้กับทางเข้าด้านข้าง" },
      { question: "ต้องนำหนังสือเดินทางไปที่แผนกต้อนรับเมื่อไร?", choices: ["Immediately on arrival", "The next morning", "At checkout"], answer: 1, reason: "The next morning หมายถึงเช้าวันถัดไป" },
    ],
  },
  {
    scenario: "travel", id: "message-your-hotel", skill: "writing", title: "Tell your hotel you'll be late", minutes: 6,
    goal: "แจ้งเวลาเดินทางถึงและขอคำแนะนำเช็กอินอย่างสุภาพ",
    type: "เขียนข้อความถึงที่พัก",
    context: "You booked a room at Brook House for Friday under the name Alex Tan. Your train has been delayed and you now expect to arrive at 10:30 p.m. Reception closes at 9 p.m.",
    question: "เขียนถึงที่พักโดยระบุชื่อผู้จอง วันและเวลาที่คาดว่าจะถึง อธิบายเหตุผลสั้น ๆ และถามวิธีรับกุญแจ",
    checklist: ["ให้ชื่อผู้จองและระบุว่าเข้าพักวันศุกร์", "แจ้งว่าจะถึงราวสี่ทุ่มครึ่งเพราะรถไฟล่าช้า", "ถามวิธีเข้าที่พักหรือรับกุญแจหลังแผนกต้อนรับปิด"],
    model: "Hello, I have a booking for Friday under the name Alex Tan. My train has been delayed, so I expect to arrive around 10:30 p.m. Could you let me know how to get in and collect my key after reception closes? Thank you.",
  },
  {
    scenario: "daily", id: "listen-to-a-delivery-call", skill: "listening", title: "Reschedule a delivery", minutes: 5,
    goal: "ฟังข้อความฝากสายเพื่อตัดสินใจว่าจะรับของอย่างไร",
    type: "ฟังข้อความฝากสาย",
    context: "Hi, this is Ben from Green Lane Market. We couldn't deliver your order this morning. We can try again tomorrow between four and six, or you can collect it from our shop until seven tonight. If you prefer collection, please text us before three so we can keep your order at the shop.",
    question: "หากเลือกให้มาส่งพรุ่งนี้ จะมาช่วงไหน?",
    choices: ["Before three", "Between four and six", "Between six and seven"], answer: 1,
    reason: "Between four and six คือช่วงสี่ถึงหกโมงเย็นของวันถัดไป",
    followUps: [
      { question: "หากจะไปรับของเอง ต้องแจ้งทางไหน?", choices: ["By email", "Through the website", "By text message"], answer: 2, reason: "Please text us คือให้แจ้งทางข้อความ" },
      { question: "วันนี้ไปรับของที่ร้านได้ถึงกี่โมง?", choices: ["Seven", "Six", "Three"], answer: 0, reason: "Until seven tonight คือรับได้ถึงหนึ่งทุ่ม ส่วนก่อนสามโมงเป็นกำหนดส่งข้อความ" },
    ],
  },
  {
    scenario: "daily", id: "make-a-neighbour-request", skill: "speaking", title: "Ask a neighbour for a favour", minutes: 5,
    goal: "บอกปัญหาและเสนอคำขอที่เฉพาะเจาะจงกับเพื่อนบ้าน",
    type: "โต้ตอบกับเพื่อนบ้าน",
    question: "คุณมีสัมภาษณ์ออนไลน์ตอนเช้า ควรตอบอย่างไร?",
    choices: ["Thanks for letting me know. Could you wait until after eleven? I have an online interview.", "You should never do any work at home.", "Thanks. I'll bring my own drill."],
    answer: 0,
    conversation: {
      speaker: "Sam", avatar: "assets/illustrations/avatar-sam.jpg",
      setting: "เพื่อนบ้านแจ้งว่าจะเจาะผนังพรุ่งนี้ช่วงเช้า ซึ่งตรงกับเวลาสัมภาษณ์ออนไลน์ของคุณ",
      opening: "Hi! I just wanted to let you know I'll be putting up some shelves tomorrow around ten.",
      replies: [
        ["Of course. I'll start at half past eleven instead. Good luck with the interview!", "คุณขอบคุณที่แจ้ง ให้เหตุผล และขอเวลาใหม่อย่างเจาะจง จึงตกลงกันได้ง่าย"],
        ["I only need to put up two shelves. Is there a particular time I should avoid?", "การห้ามทุกเวลาแรงเกินสถานการณ์ ลองระบุช่วงที่ต้องการความเงียบ"],
        ["Thanks, but I've already got one.", "การเสนอสว่านไม่ได้ช่วยแก้เวลาที่ชนกัน ลองขอให้เลื่อนเวลา"],
      ],
      speaking: "ลองพูดคำขอด้วยน้ำเสียงสุภาพ แล้วตอบรับเมื่อ Sam เสนอเวลาใหม่ เช่น That would be a big help. Thanks!",
    },
  },
  {
    scenario: "daily", id: "read-a-building-notice", skill: "reading", title: "Read a building notice", minutes: 5,
    goal: "อ่านประกาศและวางแผนจากช่วงเวลา ข้อยกเว้น และช่องทางติดต่อ",
    type: "อ่านประกาศอาคาร",
    context: "Water will be turned off in apartments on floors 3 to 6 this Wednesday, from 9 a.m. to noon, while we repair a pipe. The ground-floor laundry will remain open. Please fill a bottle before 9 a.m. if you will be working from home. If your water has not returned by 12:30 p.m., contact the building office and include your apartment number.",
    question: "ห้องพักชั้นห้าได้รับผลกระทบเมื่อไร?",
    choices: ["Tuesday morning", "Wednesday from 9 a.m. to noon", "All day Wednesday"], answer: 1,
    reason: "ชั้นห้าอยู่ในช่วงชั้น 3–6 ที่จะปิดน้ำวันพุธเก้าโมงถึงเที่ยง",
    followUps: [
      { question: "สถานที่ใดยังเปิดใช้งาน?", choices: ["The ground-floor laundry", "The showers on floor five", "The pipe repair area"], answer: 0, reason: "Will remain open หมายถึงยังเปิดตามปกติ" },
      { question: "ถ้าน้ำยังไม่ไหลหลัง 12.30 น. ต้องแจ้งข้อมูลอะไร?", choices: ["Your phone model", "Your work hours", "Your apartment number"], answer: 2, reason: "ประกาศขอให้ระบุหมายเลขห้องพักเมื่อติดต่อสำนักงานอาคาร" },
    ],
  },
  {
    scenario: "daily", id: "request-a-repair", skill: "writing", title: "Request a repair", minutes: 6,
    goal: "อธิบายปัญหาและนัดหมายช่างผ่านข้อความสั้น",
    type: "เขียนข้อความถึงสำนักงานอาคาร",
    context: "You live in apartment 508. Since yesterday, water has been dripping from the pipe under your kitchen sink. You've placed a bucket underneath it. You can be at home after 4 p.m. on weekdays.",
    question: "เขียนแจ้งเลขห้อง จุดที่รั่ว และเวลาที่สะดวก พร้อมขอนัดให้ช่างมาตรวจ",
    checklist: ["ระบุห้อง 508 และบอกว่าท่อใต้อ่างล้างจานรั่วตั้งแต่เมื่อวาน", "บอกว่าสะดวกหลังสี่โมงเย็นในวันธรรมดา", "ขอให้จัดคนมาตรวจและถามวันเวลานัด"],
    model: "Hello, I live in apartment 508. Since yesterday, water has been dripping from the pipe under my kitchen sink. Could you arrange for someone to take a look? I'm available after 4 p.m. on weekdays. Please let me know what day would work. Thanks.",
  },
  {
    scenario: "work", id: "brief-an-absent-colleague", skill: "writing", title: "Brief an absent colleague", minutes: 9,
    goal: "รวบรวมเวลา สถานที่ และสิ่งที่ต้องเตรียม แล้วส่งต่อเฉพาะข้อมูลที่เพื่อนร่วมทีมต้องใช้",
    type: "ภารกิจท้ายชุด · ถ่ายทอดข้อมูล",
    context: "Alex missed the messages about the design meeting and will be joining remotely.",
    sources: [
      { label: "ข้อความจาก Nina", text: "Our design meeting has moved from Tuesday morning to Thursday at 2 p.m. Please bring your draft." },
      { label: "ข้อความล่าสุดจากทีม", text: "The design meeting will now be online because the meeting room is booked. Please read the draft agenda before the call. The link is in your calendar invite." },
    ],
    question: "เขียนข้อความภาษาอังกฤษถึง Alex ประมาณ 45–75 คำ บอกวันเวลา ช่องทางเข้าประชุม และสองสิ่งที่ควรเตรียม",
    checklist: ["ระบุวันพฤหัสบดี 14.00 น. เป็นเวลาใหม่", "บอกว่าประชุมออนไลน์และลิงก์อยู่ในคำเชิญในปฏิทิน", "บอกให้นำฉบับร่างมาและอ่านร่างวาระก่อนประชุม"],
    model: "Hi Alex, just a quick update on the design meeting. It's now on Thursday at 2 p.m. and will take place online. You can join using the link in your calendar invite. Please bring your draft and read the draft agenda before the call. Thanks!",
  },
  {
    scenario: "travel", id: "coordinate-a-late-arrival", skill: "writing", title: "Coordinate a late arrival", minutes: 9,
    goal: "รวมข้อมูลจากที่พักและเพื่อนร่วมทาง แล้วอธิบายแผนเช็กอินที่ทั้งคู่ทำตามได้",
    type: "ภารกิจท้ายชุด · ถ่ายทอดข้อมูล",
    context: "You and Jo are staying at Brook House on Friday. Your train is delayed, and Jo has asked you what to do about check-in.",
    sources: [
      { label: "คำแนะนำจากที่พัก", text: "Reception closes at 9 p.m. If you expect to arrive later, reply before 6 p.m. on the day of arrival. We will send a temporary code for the side entrance. Bring your passport to reception the next morning." },
      { label: "ข้อความจาก Jo", text: "Looks like we'll get there around 10:30 p.m. I'm on the train now and my battery is nearly dead. Can you contact the hotel and tell me where to go when we arrive?" },
    ],
    question: "เขียนถึง Jo ประมาณ 45–75 คำ สรุปว่าจะติดต่อที่พักเมื่อไร เข้าทางไหน และต้องทำอะไรเช้าวันถัดไป",
    checklist: ["บอกว่าจะติดต่อที่พักก่อน 18.00 น. เพราะจะถึงหลังแผนกต้อนรับปิด", "บอกว่าจะใช้รหัสชั่วคราวเข้าทางด้านข้าง", "เตือนให้นำหนังสือเดินทางไปที่แผนกต้อนรับเช้าวันถัดไป"],
    model: "Hi Jo, since we're getting in around 10:30 p.m., I'll message the hotel before 6 p.m. to let them know. They'll send us a temporary code for the side entrance, so we'll go in that way. Remember to take your passport to reception the next morning.",
  },
  {
    scenario: "daily", id: "coordinate-a-building-repair", skill: "writing", title: "Coordinate a building repair", minutes: 9,
    goal: "แยกเรื่องปิดน้ำออกจากเรื่องนัดซ่อม แล้วบอกแผนให้เพื่อนร่วมห้องทำตามได้",
    type: "ภารกิจท้ายชุด · ถ่ายทอดข้อมูล",
    context: "You and Jamie live in apartment 508. Jamie works from home on Wednesday and asks what to expect.",
    sources: [
      { label: "ประกาศอาคาร", text: "Water will be off on floors 3 to 6 on Wednesday from 9 a.m. until noon. If it has not returned by 12:30 p.m., contact the building office with your apartment number." },
      { label: "ข้อความจากสำนักงานอาคาร", text: "A plumber can look at the leak under your kitchen sink on Wednesday after 4 p.m. Please confirm someone will be home." },
    ],
    question: "เขียนถึง Jamie ประมาณ 45–75 คำ สรุปช่วงปิดน้ำ วิธีแจ้งหากน้ำยังไม่ไหล และถามว่าจะอยู่รับช่างได้หรือไม่",
    checklist: ["แยกช่วงปิดน้ำ 09.00–12.00 น. ออกจากเวลานัดช่างหลัง 16.00 น.", "บอกให้ติดต่อสำนักงานพร้อมเลขห้อง 508 หากน้ำยังไม่ไหลตอน 12.30 น.", "ถามว่า Jamie อยู่รับช่างได้ไหมเพื่อจะได้ยืนยันนัด"],
    model: "Hi Jamie, the water will be off from 9 a.m. to noon on Wednesday. If it isn't back by 12:30, please tell the building office we're in apartment 508. The plumber can check the kitchen leak after 4 p.m. Will you be home then? I need to confirm with the office.",
  },
];

const cards = [
  { scenario: "work", id: "works-for-me", clue: "เวลานั้นสะดวกสำหรับฉัน", phrase: "That works for me.", example: "Thursday at two? That works for me." },
  { scenario: "work", id: "let-me-know", clue: "ช่วยแจ้งให้ฉันทราบได้ไหม", phrase: "Could you let me know?", example: "Could you let me know which room we're meeting in?" },
  { scenario: "work", id: "sounds-fun", clue: "ฟังดูสนุกนะ", phrase: "That sounds fun!", example: "That sounds fun! Where did you go?" },
  { scenario: "travel", id: "step-free-access", clue: "ทางเข้าที่ไม่ต้องขึ้นลงบันได", phrase: "step-free access", example: "Does this station have step-free access?" },
  { scenario: "travel", id: "running-late", clue: "กำลังล่าช้า หรือไปถึงช้ากว่าที่นัด", phrase: "running late", example: "My train is running late, so I'll arrive after nine." },
  { scenario: "travel", id: "under-the-name", clue: "จองไว้ในชื่อ…", phrase: "under the name …", example: "I have a booking under the name Alex Tan." },
  { scenario: "daily", id: "collect-it", clue: "ไปรับของด้วยตัวเอง", phrase: "collect it in person", example: "Can I collect it in person this evening?" },
  { scenario: "daily", id: "would-be-a-help", clue: "แบบนั้นจะช่วยได้มากเลย", phrase: "That would be a big help.", example: "Could you wait until eleven? That would be a big help." },
  { scenario: "daily", id: "take-a-look", clue: "ช่วยมาตรวจดูหน่อยได้ไหม", phrase: "Could you take a look?", example: "The pipe under my sink is leaking. Could you take a look?" },
];


// These practice pairs share the same question structure and scoring, with different details.
const listeningPairs = [
  {
    scenario: "work", title: "Relay a meeting change", goal: "ฟังบทสนทนาแล้วจับเวลาใหม่ สิ่งที่ต้องนำมา และช่องทางติดตาม",
    before: "ก่อนฟัง ลองนึกว่าคนที่พลาดข้อความต้องรู้อะไรบ้างจึงจะเข้าประชุมได้",
    forms: [
      {
        turns: [["Nina", "Can you tell Sam we've moved the supplier call? It was at eleven, but the supplier can't make it until half past two."], ["Leo", "Two thirty. Do we still need the slide deck?"], ["Nina", "Just the price list, please. I'll post the link in the project chat, not in the calendar."]],
        questions: [
          ["นัดใหม่กี่โมง?", ["11:00", "14:30", "12:30"], 1, "Leo ทวนว่า two thirty หลังจาก Nina บอกเวลาใหม่"],
          ["ต้องเตรียมอะไร?", ["The price list", "The slide deck", "The supplier's calendar"], 0, "Just the price list ระบุสิ่งที่ต้องนำมา"],
          ["ลิงก์จะอยู่ที่ไหน?", ["The calendar", "An email", "The project chat"], 2, "Nina บอกว่าจะลงลิงก์ใน project chat"],
        ],
      },
      {
        turns: [["Leo", "Could you pass on a change to tomorrow's budget review? We've had to bring it forward from ten thirty to nine."], ["Nina", "Nine, got it. Should I bring the full report?"], ["Leo", "A printed summary is enough. I'll send the room number by email this afternoon."]],
        questions: [
          ["นัดใหม่กี่โมง?", ["10:30", "09:30", "09:00"], 2, "Bring it forward … to nine คือเลื่อนมาให้เร็วขึ้นเป็นเก้าโมง"],
          ["ต้องเตรียมอะไร?", ["A printed summary", "The full report", "A room map"], 0, "A printed summary is enough คือเอาเพียงสรุปฉบับพิมพ์"],
          ["จะได้รับเลขห้องทางไหน?", ["Project chat", "Email", "A calendar invite"], 1, "Leo ระบุว่าจะส่งทาง email"],
        ],
      },
    ],
  },
  {
    scenario: "travel", title: "Check a route change", goal: "ฟังเส้นทางใหม่ จุดขึ้นรถ และข้อจำกัดจากบทสนทนาที่สถานี",
    before: "ก่อนฟัง แยกสิ่งที่เปลี่ยนจากสิ่งที่ตั๋วเดิมยังใช้ได้",
    forms: [
      {
        turns: [["Passenger", "Is the 8:15 still going to Oxford?"], ["Staff", "The train is cancelled. Use the replacement bus from stop C and change at Reading."], ["Passenger", "Do I need a bus ticket too?"], ["Staff", "No, your train ticket is valid. The bus has no room for bicycles today, though."]],
        questions: [
          ["ขึ้นรถทดแทนที่ไหน?", ["Stop B", "Platform 8", "Stop C"], 2, "พนักงานระบุ replacement bus from stop C"],
          ["ต้องเปลี่ยนรถที่เมืองไหน?", ["Reading", "Oxford", "Brighton"], 0, "Change at Reading คือให้เปลี่ยนรถที่ Reading"],
          ["ข้อจำกัดวันนี้คืออะไร?", ["Train tickets are invalid", "No room for bicycles", "Passengers must buy a bus ticket"], 1, "ตั๋วเดิมใช้ได้ แต่บนรถไม่มีที่สำหรับจักรยาน"],
        ],
      },
      {
        turns: [["Passenger", "Does this coach still stop at the airport terminal?"], ["Staff", "Not this morning. Get off at Riverside and take the free shuttle from bay four."], ["Passenger", "Can I bring my big suitcase on the shuttle?"], ["Staff", "Yes. It takes suitcases, but pets have to stay in a carrier."]],
        questions: [
          ["ขึ้นรถรับส่งที่ไหน?", ["Bay four", "Bay two", "The terminal entrance"], 0, "From bay four คือขึ้นจากช่องรถหมายเลขสี่"],
          ["ต้องลงที่ไหนเพื่อเปลี่ยนรถ?", ["At the airport terminal", "At Riverside", "At the city centre"], 1, "Get off at Riverside คือให้ลงที่ Riverside"],
          ["มีข้อจำกัดอะไร?", ["Large suitcases are not allowed", "The shuttle costs extra", "Pets need a carrier"], 2, "สัตว์เลี้ยงต้องอยู่ในกระเป๋าหรือกรงสำหรับเดินทาง"],
        ],
      },
    ],
  },
  {
    scenario: "daily", title: "Arrange a home visit", goal: "ฟังนัดหมายแล้วแยกวันเวลา เงื่อนไข และสิ่งที่ต้องทำก่อนนัด",
    before: "ก่อนฟัง ลองแยกเวลาที่จะมาถึงกับเวลาที่ต้องยืนยัน",
    forms: [
      {
        turns: [["Technician", "I can look at the washing machine on Friday from three to five."], ["Resident", "I can be home from three. Can you call my mobile when you're outside?"], ["Technician", "Of course. Please clear the shelf above the machine. There's no need to move the machine itself."]],
        questions: [
          ["มาช่วงไหน?", ["Thursday 3–5", "Friday 3–5", "Friday 5–7"], 1, "ช่างเสนอ Friday from three to five"],
          ["ติดต่อเมื่อมาถึงอย่างไร?", ["Call the mobile", "Email the office", "Knock on the neighbour's door"], 0, "คนอยู่บ้านขอให้โทรมือถือเมื่อมาถึง"],
          ["ต้องเตรียมพื้นที่อย่างไร?", ["Move the machine", "Clear the corridor", "Clear the shelf above the machine"], 2, "ช่างขอให้เคลียร์ชั้นวางเหนือเครื่อง"],
        ],
      },
      {
        turns: [["Installer", "We can fit the router on Monday between ten and twelve."], ["Resident", "That works. The main door is locked, so use the side entrance."], ["Installer", "OK. Please make sure the socket by the desk is free. Don't disconnect the old router until I arrive."]],
        questions: [
          ["มาช่วงไหน?", ["Monday 12–2", "Tuesday 10–12", "Monday 10–12"], 2, "นัด Monday between ten and twelve"],
          ["ต้องเข้าทางไหน?", ["The main entrance", "The side entrance", "The car park"], 1, "ประตูหลักล็อก จึงให้เข้าทางด้านข้าง"],
          ["ต้องเตรียมอะไร?", ["Free the socket by the desk", "Disconnect the old router", "Move the desk"], 0, "เตรียมเต้ารับข้างโต๊ะให้ว่าง และรอช่างก่อนถอดเราเตอร์เดิม"],
        ],
      },
    ],
  },
];

for (const pair of listeningPairs) {
  pair.forms.forEach(({ turns, questions }, index) => {
    const format = ([question, choices, answer, reason]) => ({ question, choices, answer, reason });
    lessons.push({
      id: `${pair.scenario}-listening-${index + 1}`, scenario: pair.scenario,
      skill: "listening", title: `${pair.title} — ${index === 0 ? "A" : "B"}`, minutes: 7,
      goal: pair.goal, type: "ฝึกฟังเพื่อนำไปใช้", pair: pair.scenario,
      before: pair.before, turns, context: turns.map(([, line]) => line).join(" "),
      ...format(questions[0]), followUps: questions.slice(1).map(format),
    });
  });
}

const speakingTasks = [
  {
    scenario: "work", id: "say-the-new-meeting-plan", title: "Explain the new plan aloud",
    goal: "แจ้งการเปลี่ยนแปลงและขอให้ผู้ฟังยืนยัน",
    question: "ฝากข้อความเสียงให้ Mina 30–60 วินาที บอกเวลาใหม่ เหตุผลที่เปลี่ยน สิ่งที่ต้องเตรียม และขอให้เธอยืนยัน",
    prompts: [
      "นัดรีวิวเดิมวันอังคาร 10.00 น. เลื่อนไปวันพุธ 15.00 น. เพราะลูกค้าติดประชุม ให้นำตัวอย่างงานหนึ่งชิ้น",
      "นัดเดโมเดิมวันศุกร์ 14.00 น. เลื่อนมาเป็นวันพฤหัสบดี 11.30 น. เพราะทีมเทคนิคว่างช่วงนั้น ให้เปิดไฟล์เดโมไว้",
    ],
    criteria: ["บอกวันและเวลาใหม่ได้ชัด", "บอกเหตุผลและสิ่งที่ต้องเตรียม", "ขอให้ผู้ฟังยืนยันด้วยประโยคสุภาพ"],
    models: [
      "Hi Mina, a quick update: the review is now on Wednesday at three because the client has another meeting. Could you bring one example of your work and let me know if the new time works for you?",
      "Hi Mina, we've moved the demo to Thursday at eleven thirty because the technical team is free then. Could you have the demo file open and let me know if you can make the new time?",
    ],
  },
  {
    scenario: "travel", id: "say-the-new-route", title: "Explain a route to a companion",
    goal: "บอกทางเลือกการเดินทางและเงื่อนไขการใช้ตั๋วตามลำดับ",
    question: "อธิบายแผนเดินทางใหม่ให้เพื่อนฟัง 30–60 วินาที บอกจุดขึ้นรถ จุดเปลี่ยนรถ และเงื่อนไขตั๋ว",
    prompts: [
      "รถไฟยกเลิก ขึ้นรถทดแทนที่ป้าย D เปลี่ยนรถที่ Central ตั๋วเดิมใช้ได้",
      "รถโค้ชไม่เข้าศูนย์เมือง ลงที่ Park Road แล้วขึ้นรถรับส่งช่อง 2 ต้องแสดงบัตรโดยสารเดิม",
    ],
    criteria: ["บอกที่ขึ้นรถและจุดเปลี่ยนรถถูกต้อง", "อธิบายเรื่องตั๋วอย่างชัดเจน", "เรียงขั้นตอนตามลำดับที่ทำจริง"],
    models: [
      "Our train's been cancelled. First, let's get the replacement bus at stop D. We'll change at Central, and we can use our original tickets for the bus.",
      "The coach isn't going into the city centre. Let's get off at Park Road and take the shuttle from bay two. Keep your original ticket handy because you'll need to show it.",
    ],
  },
  {
    scenario: "daily", id: "say-the-home-visit-plan", title: "Leave a practical voice message",
    goal: "ฝากข้อความเกี่ยวกับนัดที่บ้านและขอความช่วยเหลืออย่างเจาะจง",
    question: "ฝากข้อความให้เพื่อนร่วมห้อง 30–60 วินาที บอกช่วงนัด สิ่งที่ต้องเตรียม และถามว่าเขาช่วยอะไรได้บ้าง",
    prompts: [
      "ช่างซ่อมท่อมาวันอังคาร 16.00–18.00 น. เคลียร์ของใต้อ่าง และขอให้ช่วยเปิดประตูด้านข้าง",
      "ช่างอินเทอร์เน็ตมาวันเสาร์ 09.00–11.00 น. เคลียร์เต้ารับข้างโต๊ะ และขอให้ช่วยรับสายเมื่อช่างมาถึง",
    ],
    criteria: ["ระบุวันและช่วงเวลา", "บอกสิ่งที่ต้องเตรียม", "ขอความช่วยเหลือที่ทำตามได้ชัดเจน"],
    models: [
      "Hi, the plumber is coming on Tuesday between four and six. I'll clear the space under the sink. Could you let them in through the side door if I'm not home yet?",
      "Hi, the internet technician is coming on Saturday between nine and eleven. I'll make sure the socket by the desk is free. Could you answer the phone if they call when they arrive?",
    ],
  },
].map((task) => ({ ...task, skill: "speaking", minutes: 9, type: "พูดจากสถานการณ์" }));
lessons.push(...speakingTasks);

const transferTasks = [
  {
    scenario: "work", cue: "ประสานงานเมื่อกำหนดประชุมเปลี่ยน",
    reading: [
      ["Before the client call", "Tuesday's client call is now at 11 a.m. Please upload the revised prices by Monday at 4 p.m. The slide deck is optional. If you cannot attend, send your questions to Rosa before the call.", [
        ["กำหนดส่งราคาใหม่เมื่อไร?", ["Monday at four", "Tuesday at eleven", "Any time on Tuesday"], 0, "Upload … by Monday at 4 p.m. คือส่งให้ไม่เกินวันจันทร์สี่โมงเย็น"],
        ["อะไรเป็นทางเลือก?", ["Attending the call", "Uploading the prices", "The slide deck"], 2, "The slide deck is optional คือจะเตรียมสไลด์หรือไม่ก็ได้"],
        ["หากเข้าประชุมไม่ได้ต้องทำอะไร?", ["Ask Rosa to cancel it", "Send Rosa questions beforehand", "Upload the slide deck"], 1, "ส่งคำถามให้ Rosa ก่อนเริ่มประชุม"],
      ]],
      ["Before the staff briefing", "Thursday's staff briefing starts at 9:30 a.m. Please put your project totals into the shared sheet by Wednesday at noon. The printed notes are optional. If you cannot attend, send Theo a short update before the briefing.", [
        ["กำหนดส่งยอดโครงการเมื่อไร?", ["Thursday at nine thirty", "Wednesday at noon", "Thursday at noon"], 1, "By Wednesday at noon คือส่งภายในเที่ยงวันพุธ"],
        ["อะไรเป็นทางเลือก?", ["The printed notes", "The shared sheet", "A short update when absent"], 0, "The printed notes are optional คือจะพิมพ์บันทึกหรือไม่ก็ได้"],
        ["หากเข้าประชุมไม่ได้ต้องทำอะไร?", ["Change the starting time", "Print the shared sheet", "Send Theo an update beforehand"], 2, "ส่งอัปเดตสั้น ๆ ให้ Theo ก่อนเริ่มประชุม"],
      ]],
    ],
    writing: [
      ["Ask for another meeting time", "Ari has invited you to a meeting on Wednesday at 3 p.m. You are presenting to a client then. You can meet Thursday at 10 a.m.", "ตอบคำเชิญอย่างสุภาพ บอกเหตุผลที่ไปไม่ได้ เสนอเวลาใหม่และขอให้ยืนยัน", ["แจ้งว่าติดนำเสนองานตอนบ่ายสามวันพุธ", "เสนอสิบโมงวันพฤหัสบดี", "ขอให้ Ari ยืนยัน"], "Hi Ari, thanks for the invitation. I'm presenting to a client at three on Wednesday, so I won't be able to make it. Could we meet at ten on Thursday instead? Please let me know if that works."],
      ["Move a project check-in", "Bo suggests a project check-in on Monday at 11 a.m. You are training a new colleague at that time. You are free Tuesday at 2 p.m.", "ตอบข้อความอย่างสุภาพ บอกเหตุผลที่ไปไม่ได้ เสนอเวลาใหม่และขอให้ยืนยัน", ["แจ้งว่าติดสอนงานสิบเอ็ดโมงวันจันทร์", "เสนอบ่ายสองวันอังคาร", "ขอให้ Bo ยืนยัน"], "Hi Bo, thanks for arranging the check-in. I'm training a new colleague at eleven on Monday. Would Tuesday at two work instead? Let me know if that's convenient for you."],
    ],
  },
  {
    scenario: "travel", cue: "ตัดสินใจเมื่อแผนเดินทางเปลี่ยน",
    reading: [
      ["Read an airport shuttle notice", "On Saturday the airport shuttle will leave from Bay 7 because Bay 2 is closed. The last shuttle leaves at 10 p.m. Passengers with bookings can use their original tickets. If you miss the last service, ask at the airport information desk.", [
        ["ต้องขึ้นรถที่ไหน?", ["Bay 2", "Bay 7", "The information desk"], 1, "ประกาศเปลี่ยนจาก Bay 2 เป็น Bay 7"],
        ["รถเที่ยวสุดท้ายออกกี่โมง?", ["7 p.m.", "2 p.m.", "10 p.m."], 2, "The last shuttle leaves at 10 p.m."],
        ["ถ้าพลาดเที่ยวสุดท้ายควรทำอะไร?", ["Ask at the information desk", "Wait at Bay 2", "Buy an original ticket"], 0, "ประกาศให้สอบถามที่โต๊ะประชาสัมพันธ์"],
      ]],
      ["Read a ferry notice", "On Sunday the town ferry will depart from Pier C instead of Pier A. The final crossing leaves at 8:30 p.m. Existing reservations remain valid. If you miss the final crossing, contact the harbour office for advice.", [
        ["ต้องขึ้นเรือที่ไหน?", ["Pier A", "The harbour office", "Pier C"], 2, "Instead of Pier A คือเปลี่ยนไปขึ้น Pier C"],
        ["เรือรอบสุดท้ายออกกี่โมง?", ["8:30 p.m.", "9 p.m.", "10 p.m."], 0, "Final crossing หมายถึงรอบข้ามฟากสุดท้าย"],
        ["ถ้าพลาดเที่ยวสุดท้ายควรทำอะไร?", ["Make a new reservation immediately", "Contact the harbour office", "Wait at Pier A"], 1, "ให้ติดต่อสำนักงานท่าเรือเพื่อขอคำแนะนำ"],
      ]],
    ],
    writing: [
      ["Ask to move a tour booking", "Your walking tour is booked for Friday at 10 a.m. Your coach is delayed. You can join the Saturday tour at 2 p.m. Your reference is WT42.", "เขียนถึงผู้จัดทัวร์ ระบุรหัสเดิม เหตุผล รอบใหม่ และถามว่าจะต้องจ่ายเพิ่มไหม", ["ระบุ WT42 และรอบเดิม", "อธิบายว่ารถล่าช้าและขอรอบวันเสาร์บ่ายสอง", "ถามเรื่องค่าเปลี่ยนรอบ"], "Hello, my booking WT42 is for Friday at ten. My coach has been delayed, so could I move my booking to Saturday at two? Please let me know if there is a fee for changing it. Thank you."],
      ["Ask to move a museum booking", "Your museum visit is booked for Sunday at noon. Your train is cancelled. You can visit Monday at 3 p.m. Your reference is MU18.", "เขียนถึงพิพิธภัณฑ์ ระบุรหัสเดิม เหตุผล รอบใหม่ และถามว่าจะต้องจ่ายเพิ่มไหม", ["ระบุ MU18 และรอบเดิม", "อธิบายว่ารถไฟยกเลิกและขอรอบวันจันทร์บ่ายสาม", "ถามเรื่องค่าเปลี่ยนรอบ"], "Hello, my booking MU18 is for Sunday at noon. My train was cancelled, so could I change the visit to Monday at three? Could you also tell me whether there is a change fee? Thanks."],
    ],
  },
  {
    scenario: "daily", cue: "จัดการการรับของและนัดหมาย",
    reading: [
      ["Read a parcel pickup notice", "Collect parcel PK72 at the market counter by 6 p.m. on Friday. Bring a photo ID. If someone else collects it, forward this message to them and ask them to show their own ID.", [
        ["รับของได้ถึงเมื่อไร?", ["Friday at six", "Saturday at six", "Friday at seven"], 0, "By 6 p.m. on Friday คือไม่เกินหกโมงเย็นวันศุกร์"],
        ["ผู้มารับต้องนำอะไร?", ["A shopping bag", "A photo ID", "A printed invoice"], 1, "Bring a photo ID คือให้นำบัตรที่มีรูปถ่าย"],
        ["หากให้คนอื่นไปรับ ต้องส่งอะไรให้เขา?", ["The buyer's ID", "A payment link", "This message"], 2, "Forward this message คือส่งต่อข้อความนี้ให้คนที่ไปรับ"],
      ]],
      ["Read a library collection notice", "Collect your reserved books at the branch desk by 5 p.m. on Tuesday. Bring your library card. If a friend collects the books, send them your collection code and ask them to show their own ID.", [
        ["รับหนังสือได้ถึงเมื่อไร?", ["Tuesday at six", "Tuesday at five", "Wednesday at five"], 1, "By 5 p.m. on Tuesday คือไม่เกินห้าโมงเย็นวันอังคาร"],
        ["ถ้าไปรับเองต้องนำอะไร?", ["Your library card", "Your friend's ID", "A printed receipt"], 0, "Bring your library card คือให้นำบัตรห้องสมุด"],
        ["หากให้เพื่อนไปรับ ต้องส่งอะไรให้เขา?", ["Your own ID", "Your home address", "Your collection code"], 2, "ประกาศให้ส่งรหัสรับหนังสือให้เพื่อน"],
      ]],
    ],
    writing: [
      ["Change a delivery appointment", "Order GN14 is due on Tuesday from 2 to 4 p.m. You are at work then. You can receive it on Thursday from 5 to 7 p.m.", "แจ้งรหัสและรอบเดิม บอกข้อจำกัด เสนอรอบใหม่ และขอให้ร้านยืนยัน", ["ระบุ GN14 และรอบเดิม", "บอกว่าติดงานและเสนอวันพฤหัสบดีห้าถึงหนึ่งทุ่ม", "ขอให้ร้านยืนยัน"], "Hi, order GN14 is due Tuesday from two to four, but I'll be at work then. Could you deliver it on Thursday between five and seven instead? Please confirm whether that slot is available."],
      ["Change a collection appointment", "Order CL61 is booked for collection on Wednesday at 10 a.m. You have a medical appointment then. You can collect it on Friday at 4 p.m.", "แจ้งรหัสและรอบเดิม บอกข้อจำกัด เสนอรอบใหม่ และขอให้ร้านยืนยัน", ["ระบุ CL61 และรอบเดิม", "บอกว่าติดนัดและเสนอวันศุกร์สี่โมงเย็น", "ขอให้ร้านยืนยัน"], "Hi, I'm due to collect order CL61 on Wednesday at ten. I have an appointment then. Could I collect it on Friday at four instead? Please let me know if you can keep the order until then."],
    ],
  },
];

for (const { scenario, cue, reading, writing } of transferTasks) {
  reading.forEach(([title, context, questions], index) => {
    const formatted = questions.map(([question, choices, answer, reason]) => ({ question, choices, answer, reason }));
    lessons.push({ id: `${scenario}-reading-${index + 1}`, scenario, skill: "reading", title, context, goal: cue,
      minutes: 6, type: "อ่านแล้วตัดสินใจ", ...formatted[0], followUps: formatted.slice(1), transfer: index });
  });
  writing.forEach(([title, context, question, checklist, model], index) => {
    lessons.push({ id: `${scenario}-writing-${index + 1}`, scenario, skill: "writing", title, context, goal: cue,
      minutes: 8, type: "เขียนตอบสถานการณ์", question, checklist, model, transfer: index });
  });
}
