export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'get' : IDL.Func([IDL.Text], [IDL.Opt(IDL.Text)], ['query']),
    'p2a' : IDL.Func([IDL.Principal], [IDL.Text], []),
    'set' : IDL.Func([IDL.Text, IDL.Text], [IDL.Opt(IDL.Text)], []),
    'whoami' : IDL.Func([], [IDL.Principal], []),
  });
};
export const init = ({ IDL }) => { return []; };
