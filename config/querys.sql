SELECT messages.id, profiles.name, profiles.surname, content 
FROM messages 
INNER JOIN profiles ON profiles.id=sender 
WHERE receiver=3 ORDER BY id DESC;