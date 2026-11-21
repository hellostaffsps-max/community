type MemberIdentity={display_name:string;username:string};

export function hasGeneratedUsername(username:string):boolean {
  return /^u_[a-f0-9]{16,32}$/i.test(username);
}

export function hasDefaultDisplayName(name:string):boolean {
  return !name.trim()||name.trim()==='عضو جديد';
}

export function accountNeedsSetup(profile:MemberIdentity):boolean {
  return hasDefaultDisplayName(profile.display_name)||hasGeneratedUsername(profile.username);
}
