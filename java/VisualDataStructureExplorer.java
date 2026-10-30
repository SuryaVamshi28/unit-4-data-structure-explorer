import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
import java.awt.geom.Line2D;
import java.util.*;

/**
 * Visual Data Structure Explorer
 * A self-contained Java Swing teaching application. All structures are in-memory
 * and are reset when the application closes.
 */
public class VisualDataStructureExplorer extends JFrame {
    private static final Color NAVY = new Color(22, 43, 68);
    private static final Color BLUE = new Color(42, 105, 190);
    private static final Color PALE = new Color(242, 247, 252);
    private final JComboBox<String> structureBox = new JComboBox<>(new String[]{
            "Stack", "Queue", "Linked List", "Binary Search Tree", "Min-Heap", "Graph"
    });
    private final JComboBox<String> operationBox = new JComboBox<>();
    private final JTextField valueField = new JTextField(16);
    private final JLabel complexity = new JLabel("Choose a data structure and operation.");
    private final JLabel status = new JLabel("Ready. Choose a structure, enter a value, and perform an operation.");
    private final JTextArea steps = new JTextArea();
    private final CanvasPanel canvas = new CanvasPanel();

    private final ArrayList<String> stack = new ArrayList<>();
    private final ArrayDeque<String> queue = new ArrayDeque<>();
    private final ArrayList<String> list = new ArrayList<>();
    private TreeNode bst;
    private final ArrayList<Integer> heap = new ArrayList<>();
    private final LinkedHashMap<String, LinkedHashSet<String>> graph = new LinkedHashMap<>();

    public VisualDataStructureExplorer() {
        super("Visual Data Structure Explorer — Advanced Data Structures");
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setMinimumSize(new Dimension(920, 650));
        setSize(1120, 760);
        setLocationRelativeTo(null);
        setLayout(new BorderLayout());
        add(buildHeader(), BorderLayout.NORTH);
        add(buildMain(), BorderLayout.CENTER);
        add(buildFooter(), BorderLayout.SOUTH);
        structureBox.addActionListener(e -> updateOperations());
        operationBox.addActionListener(e -> updateComplexity());
        updateOperations();
    }

    private JComponent buildHeader() {
        JPanel p = new JPanel(new BorderLayout());
        p.setBackground(NAVY);
        p.setBorder(new EmptyBorder(18, 24, 18, 24));
        JLabel title = new JLabel("VISUAL DATA STRUCTURE EXPLORER");
        title.setForeground(Color.WHITE); title.setFont(new Font("Segoe UI", Font.BOLD, 22));
        JLabel subtitle = new JLabel("STACK  ·  QUEUE  ·  LINKED LIST  ·  BST  ·  MIN-HEAP  ·  GRAPH");
        subtitle.setForeground(new Color(190, 211, 235)); subtitle.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        JPanel text = new JPanel(new GridLayout(2, 1, 0, 4)); text.setOpaque(false);
        text.add(title); text.add(subtitle); p.add(text, BorderLayout.WEST);
        return p;
    }

    private JComponent buildMain() {
        JPanel outer = new JPanel(new BorderLayout(12, 12));
        outer.setBackground(PALE); outer.setBorder(new EmptyBorder(16, 18, 12, 18));
        JPanel controls = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 8));
        controls.setBackground(Color.WHITE); controls.setBorder(BorderFactory.createTitledBorder("Operation controls"));
        controls.add(new JLabel("Structure:")); controls.add(structureBox);
        controls.add(new JLabel("Operation:")); controls.add(operationBox);
        controls.add(new JLabel("Value(s):")); controls.add(valueField);
        JButton run = new JButton("Perform operation"); run.setBackground(BLUE); run.setForeground(Color.WHITE);
        run.setFocusPainted(false); run.addActionListener(e -> perform()); controls.add(run);
        JButton clear = new JButton("Reset selected"); clear.addActionListener(e -> resetSelected()); controls.add(clear);
        outer.add(controls, BorderLayout.NORTH);

        JSplitPane split = new JSplitPane(JSplitPane.VERTICAL_SPLIT, canvas, buildStepsPanel());
        split.setResizeWeight(.72); split.setBorder(null); split.setDividerSize(7);
        outer.add(split, BorderLayout.CENTER);
        return outer;
    }

    private JComponent buildStepsPanel() {
        JPanel p = new JPanel(new BorderLayout(8, 6));
        p.setBackground(Color.WHITE); p.setBorder(BorderFactory.createTitledBorder("Operation trace"));
        steps.setEditable(false); steps.setFont(new Font("Consolas", Font.PLAIN, 13));
        steps.setLineWrap(true); steps.setWrapStyleWord(true); steps.setText("1. Select a structure.\n2. Choose an operation and enter its value.\n3. The drawing and step trace update after each operation.");
        p.add(new JScrollPane(steps), BorderLayout.CENTER);
        complexity.setFont(new Font("Segoe UI", Font.BOLD, 13)); complexity.setForeground(new Color(40, 83, 132));
        complexity.setBorder(new EmptyBorder(5, 8, 5, 8)); p.add(complexity, BorderLayout.SOUTH);
        return p;
    }

    private JComponent buildFooter() {
        JPanel p = new JPanel(new BorderLayout()); p.setBackground(PALE); p.setBorder(new EmptyBorder(0, 20, 10, 20));
        status.setFont(new Font("Segoe UI", Font.PLAIN, 12)); status.setForeground(new Color(78, 96, 116)); p.add(status);
        return p;
    }

    private void updateOperations() {
        String s = (String) structureBox.getSelectedItem();
        String[] ops = switch (s) {
            case "Stack" -> new String[]{"Push", "Pop", "Peek"};
            case "Queue" -> new String[]{"Enqueue", "Dequeue", "Front"};
            case "Linked List" -> new String[]{"Insert at end", "Delete value", "Search"};
            case "Binary Search Tree" -> new String[]{"Insert", "Search", "In-order traversal"};
            case "Min-Heap" -> new String[]{"Insert", "Remove minimum", "Peek minimum"};
            default -> new String[]{"Add vertex", "Add edge (A,B)", "BFS from vertex", "DFS from vertex"};
        };
        operationBox.setModel(new DefaultComboBoxModel<>(ops));
        updateComplexity(); canvas.repaint();
        valueField.setToolTipText(s.equals("Graph") ? "Use A,B for an edge; enter a vertex for BFS/DFS." : "Enter one value.");
    }

    private void updateComplexity() {
        String s = (String) structureBox.getSelectedItem(), op = (String) operationBox.getSelectedItem();
        if (op == null) return;
        String cost = switch (s + "/" + op) {
            case "Stack/Push", "Stack/Pop", "Stack/Peek", "Queue/Enqueue", "Queue/Dequeue", "Queue/Front" -> "O(1)";
            case "Linked List/Insert at end" -> "O(n)";
            case "Linked List/Delete value", "Linked List/Search" -> "O(n)";
            case "Binary Search Tree/Insert", "Binary Search Tree/Search" -> "O(h) · average O(log n), worst O(n)";
            case "Binary Search Tree/In-order traversal" -> "O(n)";
            case "Min-Heap/Insert", "Min-Heap/Remove minimum" -> "O(log n)";
            case "Min-Heap/Peek minimum" -> "O(1)";
            case "Graph/Add vertex" -> "O(1) average";
            case "Graph/Add edge (A,B)" -> "O(1) average";
            case "Graph/BFS from vertex", "Graph/DFS from vertex" -> "O(V + E)";
            default -> "Choose an operation";
        };
        complexity.setText("Time complexity: " + cost);
    }

    private void perform() {
        String s = (String) structureBox.getSelectedItem(), op = (String) operationBox.getSelectedItem();
        String value = valueField.getText().trim();
        ArrayList<String> trace = new ArrayList<>();
        try {
            switch (s) {
                case "Stack" -> stackAction(op, value, trace);
                case "Queue" -> queueAction(op, value, trace);
                case "Linked List" -> listAction(op, value, trace);
                case "Binary Search Tree" -> bstAction(op, value, trace);
                case "Min-Heap" -> heapAction(op, value, trace);
                case "Graph" -> graphAction(op, value, trace);
            }
            if (trace.isEmpty()) trace.add("No change was made.");
            showTrace(trace); status.setText(trace.get(trace.size() - 1)); canvas.repaint();
        } catch (IllegalArgumentException ex) {
            status.setText(ex.getMessage()); JOptionPane.showMessageDialog(this, ex.getMessage(), "Check input", JOptionPane.INFORMATION_MESSAGE);
        }
    }

    private void stackAction(String op, String v, ArrayList<String> t) {
        switch (op) {
            case "Push" -> { require(v); stack.add(v); t.add("Push: place " + v + " at the top."); t.add("The previous top remains directly below it."); }
            case "Pop" -> { if (stack.isEmpty()) { t.add("Stack is empty; nothing to pop."); return; } String x=stack.remove(stack.size()-1); t.add("Read and remove top value " + x + "."); t.add("The next item becomes the new top."); }
            default -> { t.add(stack.isEmpty()?"Stack is empty.":"Top value is " + stack.get(stack.size()-1) + "."); }
        }
    }

    private void queueAction(String op, String v, ArrayList<String> t) {
        switch (op) {
            case "Enqueue" -> { require(v); queue.addLast(v); t.add("Enqueue: add " + v + " at the rear."); t.add("Existing items stay ahead of the new item."); }
            case "Dequeue" -> { if (queue.isEmpty()) { t.add("Queue is empty; nothing to dequeue."); return; } String x=queue.removeFirst(); t.add("Remove front value " + x + "."); t.add("The next queued item becomes the front."); }
            default -> t.add(queue.isEmpty()?"Queue is empty.":"Front value is " + queue.peekFirst() + ".");
        }
    }

    private void listAction(String op, String v, ArrayList<String> t) {
        require(v);
        if (op.equals("Insert at end")) { list.add(v); t.add("Start at the head and follow next links to the final node."); t.add("Attach " + v + " after the old tail; its next link is null."); }
        else if (op.equals("Delete value")) { int i=list.indexOf(v); if(i<0){t.add("Visit each node; value " + v + " is not present.");return;} list.remove(i); t.add("Scan from the head and find " + v + "."); t.add("Reconnect the previous node to the next node; remove " + v + "."); }
        else { int i=list.indexOf(v); t.add("Compare " + v + " with each node from the head."); t.add(i<0?"Value not found after " + list.size() + " comparison(s).":"Found at zero-based position " + i + "."); }
    }

    private void bstAction(String op, String v, ArrayList<String> t) {
        if (op.equals("In-order traversal")) { inOrder(bst,t); t.add("Sorted traversal: " + (t.size()==1?"(empty)":String.join(" → ",t.subList(1,t.size())))); return; }
        int x=parseInt(v);
        if (op.equals("Insert")) {
            if (bst==null) { bst=new TreeNode(x); t.add("Tree is empty: create root " + x + "."); return; }
            TreeNode n=bst;
            while(true){ if(x==n.key){t.add("Key already exists; duplicates are ignored.");return;} if(x<n.key){t.add(x+" < "+n.key+": follow left child.");if(n.left==null){n.left=new TreeNode(x);t.add("Insert "+x+" as the left child.");return;}n=n.left;}else{t.add(x+" > "+n.key+": follow right child.");if(n.right==null){n.right=new TreeNode(x);t.add("Insert "+x+" as the right child.");return;}n=n.right;} }
        } else { TreeNode n=bst; while(n!=null){t.add("Compare "+x+" with node "+n.key+".");if(x==n.key){t.add("Found "+x+".");return;}n=x<n.key?n.left:n.right;}t.add("Reached an empty child; key not found."); }
    }
    private void inOrder(TreeNode n, ArrayList<String> out) { if(n==null)return; inOrder(n.left,out); out.add(String.valueOf(n.key)); inOrder(n.right,out); }

    private void heapAction(String op, String v, ArrayList<String> t) {
        if (op.equals("Insert")) { int x=parseInt(v); heap.add(x); int i=heap.size()-1; t.add("Append "+x+" at array index "+i+"."); while(i>0){int p=(i-1)/2;if(heap.get(p)<=heap.get(i))break;Collections.swap(heap,p,i);t.add("Swap with parent at index "+p+" to restore min-heap order.");i=p;} }
        else if (op.equals("Peek minimum")) t.add(heap.isEmpty()?"Heap is empty.":"Minimum is at root: "+heap.get(0)+".");
        else { if(heap.isEmpty()){t.add("Heap is empty; nothing to remove.");return;} int min=heap.get(0),last=heap.remove(heap.size()-1); t.add("Remove root minimum "+min+".");if(!heap.isEmpty()){heap.set(0,last);t.add("Move last value "+last+" to the root.");int i=0;while(true){int c=2*i+1;if(c>=heap.size())break;if(c+1<heap.size()&&heap.get(c+1)<heap.get(c))c++;if(heap.get(i)<=heap.get(c))break;Collections.swap(heap,i,c);t.add("Swap with smaller child at index "+c+".");i=c;}} }
    }

    private void graphAction(String op, String v, ArrayList<String> t) {
        if (op.equals("Add vertex")) { require(v);if(graph.containsKey(v)){t.add("Vertex already exists.");return;}graph.put(v,new LinkedHashSet<>());t.add("Create vertex "+v+" with an empty adjacency list."); }
        else if (op.equals("Add edge (A,B)")) { String[] e=v.split(",",-1);if(e.length!=2||e[0].trim().isEmpty()||e[1].trim().isEmpty())throw new IllegalArgumentException("Enter an edge as A,B (for example A,B).");String a=e[0].trim(),b=e[1].trim();graph.computeIfAbsent(a,k->new LinkedHashSet<>());graph.computeIfAbsent(b,k->new LinkedHashSet<>());graph.get(a).add(b);graph.get(b).add(a);t.add("Add vertices if missing, then connect "+a+" ↔ "+b+".");t.add("This explorer treats graph edges as undirected."); }
        else { require(v);if(!graph.containsKey(v)){t.add("Start vertex does not exist. Add it first.");return;}boolean bfs=op.startsWith("BFS");Set<String> seen=new LinkedHashSet<>();Deque<String> todo=new ArrayDeque<>();todo.add(v);seen.add(v);t.add("Start at "+v+"; mark it visited.");while(!todo.isEmpty()){String n=bfs?todo.removeFirst():todo.removeLast();t.add((bfs?"Visit ":"Visit ")+n+"; inspect its unvisited neighbors.");for(String next:graph.get(n))if(seen.add(next)){todo.addLast(next);t.add("Discover "+next+" from "+n+" and add it to the "+(bfs?"queue":"stack")+".");}}t.add((bfs?"BFS":"DFS")+" order: "+String.join(" → ",seen)+"."); }
    }

    private void resetSelected() {
        switch ((String)structureBox.getSelectedItem()) {
            case "Stack" -> stack.clear(); case "Queue" -> queue.clear(); case "Linked List" -> list.clear();
            case "Binary Search Tree" -> bst=null; case "Min-Heap" -> heap.clear(); case "Graph" -> graph.clear();
        }
        steps.setText("Selected structure reset."); status.setText("Selected structure reset."); canvas.repaint();
    }
    private void showTrace(java.util.List<String> trace) { StringBuilder b=new StringBuilder();for(int i=0;i<trace.size();i++)b.append(i+1).append(". ").append(trace.get(i)).append('\n');steps.setText(b.toString());steps.setCaretPosition(0); }
    private static void require(String s) { if(s==null||s.isBlank())throw new IllegalArgumentException("Enter a value before performing this operation."); }
    private static int parseInt(String s) { try{return Integer.parseInt(s.trim());}catch(Exception e){throw new IllegalArgumentException("For this operation, enter a whole-number value.");} }

    private static final class TreeNode { final int key; TreeNode left,right; TreeNode(int k){key=k;} }
    private final class CanvasPanel extends JPanel {
        CanvasPanel(){setBackground(Color.WHITE);setBorder(BorderFactory.createTitledBorder("Live visualization"));setPreferredSize(new Dimension(800,400));}
        @Override protected void paintComponent(Graphics raw){super.paintComponent(raw);Graphics2D g=(Graphics2D)raw.create();g.setRenderingHint(RenderingHints.KEY_ANTIALIASING,RenderingHints.VALUE_ANTIALIAS_ON);String s=(String)structureBox.getSelectedItem();switch(s){case "Stack"->drawStack(g);case "Queue"->drawQueue(g);case "Linked List"->drawList(g);case "Binary Search Tree"->drawTree(g,bst);case "Min-Heap"->drawHeap(g);case "Graph"->drawGraph(g);}g.dispose();}
        private void label(Graphics2D g,String s,int x,int y){g.setColor(new Color(74,91,110));g.setFont(new Font("Segoe UI",Font.BOLD,14));g.drawString(s,x,y);}
        private void box(Graphics2D g,String s,int x,int y,int w,int h,boolean active){g.setColor(active?new Color(226,239,255):new Color(247,250,253));g.fillRoundRect(x,y,w,h,12,12);g.setColor(active?BLUE:new Color(151,174,198));g.setStroke(new BasicStroke(1.5f));g.drawRoundRect(x,y,w,h,12,12);g.setColor(NAVY);g.setFont(new Font("Segoe UI",Font.BOLD,14));FontMetrics fm=g.getFontMetrics();g.drawString(s,x+(w-fm.stringWidth(s))/2,y+(h+fm.getAscent())/2-3);}
        private void drawStack(Graphics2D g){label(g,"TOP",28,48);int x=Math.max(120,getWidth()/2-65),y=getHeight()-55;for(int i=0;i<stack.size();i++){box(g,stack.get(i),x,y-i*48,130,40,i==stack.size()-1);}if(stack.isEmpty())label(g,"Stack is empty — push a value to begin",x-85,getHeight()/2);}
        private void drawQueue(Graphics2D g){label(g,"FRONT",22,48);label(g,"REAR",getWidth()-70,48);int x=35,y=getHeight()/2-22;int i=0;for(String v:queue){box(g,v,x+i*105,y,88,44,i==0);i++;}if(queue.isEmpty())label(g,"Queue is empty — enqueue a value to begin",Math.max(30,getWidth()/2-160),getHeight()/2);}
        private void drawList(Graphics2D g){int n=list.size(),x=Math.max(24,(getWidth()-n*112)/2),y=getHeight()/2-22;for(int i=0;i<n;i++){box(g,list.get(i),x+i*112,y,76,44,i==0);if(i<n-1){g.setColor(BLUE);g.drawLine(x+i*112+78,y+22,x+(i+1)*112-4,y+22);g.drawLine(x+(i+1)*112-10,y+17,x+(i+1)*112-4,y+22);g.drawLine(x+(i+1)*112-10,y+27,x+(i+1)*112-4,y+22);}}if(n==0)label(g,"Head → (empty)",Math.max(30,getWidth()/2-60),getHeight()/2);}
        private void drawTree(Graphics2D g,TreeNode root){if(root==null){label(g,"Tree is empty — insert a number to build it",Math.max(30,getWidth()/2-150),getHeight()/2);return;}int depth=height(root);drawTreeNode(g,root,getWidth()/2,58,Math.max(34,getWidth()/4),1,depth);}
        private int height(TreeNode n){return n==null?0:1+Math.max(height(n.left),height(n.right));}
        private void drawTreeNode(Graphics2D g,TreeNode n,int x,int y,int dx,int depth,int h){if(n==null)return;int childY=y+75;if(n.left!=null){g.setColor(new Color(153,174,197));g.draw(new Line2D.Double(x,y+17,x-dx,childY-17));drawTreeNode(g,n.left,x-dx,childY,Math.max(25,dx/2),depth+1,h);}if(n.right!=null){g.setColor(new Color(153,174,197));g.draw(new Line2D.Double(x,y+17,x+dx,childY-17));drawTreeNode(g,n.right,x+dx,childY,Math.max(25,dx/2),depth+1,h);}box(g,String.valueOf(n.key),x-25,y-18,50,36,depth==1);}
        private void drawHeap(Graphics2D g){if(heap.isEmpty()){label(g,"Heap is empty — insert a number to begin",Math.max(30,getWidth()/2-145),getHeight()/2);return;}drawHeapNode(g,0,getWidth()/2,55,Math.max(30,getWidth()/4));label(g,"Array: "+heap,getWidth()/2-100,getHeight()-22);}
        private void drawHeapNode(Graphics2D g,int i,int x,int y,int dx){if(i>=heap.size())return;int l=2*i+1,r=l+1,cy=y+72;if(l<heap.size()){g.setColor(new Color(153,174,197));g.drawLine(x,y+17,x-dx,cy-17);drawHeapNode(g,l,x-dx,cy,Math.max(22,dx/2));}if(r<heap.size()){g.setColor(new Color(153,174,197));g.drawLine(x,y+17,x+dx,cy-17);drawHeapNode(g,r,x+dx,cy,Math.max(22,dx/2));}box(g,String.valueOf(heap.get(i)),x-25,y-18,50,36,i==0);}
        private void drawGraph(Graphics2D g){int n=graph.size();if(n==0){label(g,"Graph is empty — add a vertex, then add edges as A,B",Math.max(30,getWidth()/2-185),getHeight()/2);return;}ArrayList<String> keys=new ArrayList<>(graph.keySet());Point[] pts=new Point[n];int cx=getWidth()/2,cy=getHeight()/2;double radius=Math.max(70,Math.min(getWidth(),getHeight())*.34);for(int i=0;i<n;i++){double a=2*Math.PI*i/n-Math.PI/2;pts[i]=new Point(cx+(int)(radius*Math.cos(a)),cy+(int)(radius*Math.sin(a)));}g.setStroke(new BasicStroke(2));g.setColor(new Color(151,174,198));for(int i=0;i<n;i++)for(String b:graph.get(keys.get(i))){int j=keys.indexOf(b);if(j>i)g.drawLine(pts[i].x,pts[i].y,pts[j].x,pts[j].y);}for(int i=0;i<n;i++){g.setColor(new Color(226,239,255));g.fillOval(pts[i].x-24,pts[i].y-24,48,48);g.setColor(BLUE);g.drawOval(pts[i].x-24,pts[i].y-24,48,48);g.setColor(NAVY);g.setFont(new Font("Segoe UI",Font.BOLD,13));FontMetrics fm=g.getFontMetrics();g.drawString(keys.get(i),pts[i].x-fm.stringWidth(keys.get(i))/2,pts[i].y+5);} }
    }

    public static void main(String[] args) { SwingUtilities.invokeLater(() -> new VisualDataStructureExplorer().setVisible(true)); }
}

